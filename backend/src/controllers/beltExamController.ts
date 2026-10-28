import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendBeltPromotionEmail } from '../services/emailService';
import { resolveEventStatus } from '../utils/eventStatus';

// Belt rank order (same as beltController)
const BELT_ORDER = [
    'White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown',
    'Black 1st Dan', 'Black 2nd Dan', 'Black 3rd Dan', 'Black 4th Dan',
];

const getNextBelt = (current: string): string | null => {
    const idx = BELT_ORDER.indexOf(current);
    if (idx === -1 || idx >= BELT_ORDER.length - 1) return null;
    return BELT_ORDER[idx + 1];
};

// ─── Get Belt Exam Participants with results ──────────────────────────
export const getBeltExamParticipants = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));
    if (event.type !== 'BELT_EXAM') return next(new AppError('This is not a belt exam event', 400));

    // Get all approved registrations
    const registrations = await prisma.eventRegistration.findMany({
        where: { eventId, approvalStatus: 'APPROVED' },
        include: {
            user: {
                select: {
                    id: true, name: true, email: true, currentBeltRank: true,
                    membershipNumber: true, profilePhotoUrl: true,
                    dojo: { select: { name: true, city: true } },
                },
            },
        },
    });

    // Get existing exam results
    const examResults = await prisma.beltExamResult.findMany({
        where: { eventId },
    });
    const resultMap = new Map(examResults.map(r => [r.studentId, r]));

    const participants = registrations.map(reg => {
        const result = resultMap.get(reg.userId);
        const currentBelt = reg.user.currentBeltRank || 'White';
        const targetBelt = getNextBelt(currentBelt);
        return {
            registrationId: reg.id,
            student: reg.user,
            currentBelt,
            targetBelt,
            result: result?.result || 'PENDING',
            resultId: result?.id || null,
            notes: result?.notes || null,
            gradedAt: result?.gradedAt || null,
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            event: { id: event.id, name: event.name, startDate: event.startDate, status: resolveEventStatus(event) },
            participants,
            summary: {
                total: participants.length,
                passed: participants.filter(p => p.result === 'PASS').length,
                failed: participants.filter(p => p.result === 'FAIL').length,
                pending: participants.filter(p => p.result === 'PENDING').length,
            },
        },
    });
});

// ─── Grading ────────────────────────────────────────────────────────
//
// One routine for single and bulk grading. Before, each call worked out the target
// belt from the student's *current* belt and promoted on every PASS, so a retry or a
// second grader promoted again (White → Orange → Blue), and any instructor could
// grade any student. Now:
//   • only the admin, the student's own instructor, or the exam's assigned instructor grades;
//   • a promotion happens only when the result first becomes PASS, to the belt the exam
//     was recorded for;
//   • the belt change applies only if the student is still on the examined belt, so
//     concurrent requests cannot both promote.

type Grader = { id: string; role: string; name?: string | null };
type GradeOutcome =
    | { kind: 'promoted'; studentName: string; from: string; to: string; examResult: unknown; email: string }
    | { kind: 'recorded'; studentName: string; from: string; to: string; examResult: unknown; result: 'PASS' | 'FAIL' };

async function gradeOne(
    event: { id: string; name: string; startDate: Date; assignedInstructorId: string | null },
    studentId: string,
    result: 'PASS' | 'FAIL',
    notes: string | null,
    grader: Grader,
): Promise<GradeOutcome> {
    const registration = await prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: studentId } },
    });
    if (!registration) throw new AppError('Student is not registered for this exam', 404);
    if (registration.approvalStatus !== 'APPROVED') throw new AppError('Registration is not approved', 400);

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError('Student not found', 404);

    if (grader.role !== 'ADMIN' && student.primaryInstructorId !== grader.id && event.assignedInstructorId !== grader.id) {
        throw new AppError('You can only grade your own students, or an exam assigned to you', 403);
    }

    return prisma.$transaction(async (tx) => {
        const existing = await tx.beltExamResult.findUnique({
            where: { eventId_studentId: { eventId: event.id, studentId } },
        });
        const from = existing?.currentBelt ?? (student.currentBeltRank || 'White');
        const to = existing?.targetBelt ?? getNextBelt(from);
        if (!to) throw new AppError('Student is already at the highest belt rank', 400);

        const examResult = existing
            ? await tx.beltExamResult.update({
                  where: { id: existing.id },
                  data: { result, notes, gradedBy: grader.id, gradedAt: new Date() },
              })
            : await tx.beltExamResult.create({
                  data: { eventId: event.id, studentId, currentBelt: from, targetBelt: to, result, notes, gradedBy: grader.id, gradedAt: new Date() },
              });

        const becamePass = result === 'PASS' && existing?.result !== 'PASS';
        if (becamePass) {
            // Promote only from the belt the student was examined at.
            const moved = await tx.user.updateMany({
                where: { id: studentId, currentBeltRank: from },
                data: { currentBeltRank: to },
            });
            if (moved.count === 1) {
                await tx.beltHistory.create({
                    data: {
                        studentId,
                        oldBelt: from,
                        newBelt: to,
                        promotedBy: grader.id,
                        promotionDate: event.startDate, // the exam date
                        notes: `Belt exam: ${event.name}${notes ? ` — ${notes}` : ''}`,
                    },
                });
                return { kind: 'promoted' as const, studentName: student.name, from, to, examResult, email: student.email };
            }
        }
        return { kind: 'recorded' as const, studentName: student.name, from, to, examResult, result };
    }, { timeout: 15000, maxWait: 10000 });
}

function notifyPromotion(outcome: GradeOutcome, grader: Grader) {
    if (outcome.kind === 'promoted') {
        sendBeltPromotionEmail(outcome.email, outcome.studentName, outcome.to, grader.name || 'Sensei').catch(() => {});
    }
}

// ─── Grade a student: PASS or FAIL ──────────────────────────────────
export const gradeStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, studentId } = req.params;
    const { result, notes } = req.body; // result = "PASS" | "FAIL"

    if (!['PASS', 'FAIL'].includes(result)) {
        return next(new AppError('Result must be PASS or FAIL', 400));
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));
    if (event.type !== 'BELT_EXAM') return next(new AppError('This is not a belt exam event', 400));

    const outcome = await gradeOne(event, studentId, result, notes || null, req.user);
    notifyPromotion(outcome, req.user);

    res.status(200).json({
        status: 'success',
        message:
            outcome.kind === 'promoted'
                ? `${outcome.studentName} promoted from ${outcome.from} to ${outcome.to}`
                : result === 'PASS'
                  ? `${outcome.studentName} has already passed this exam`
                  : `${outcome.studentName} did not pass the belt exam`,
        data: { examResult: outcome.examResult },
    });
});

// ─── Bulk grade students ────────────────────────────────────────────
export const bulkGradeStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { grades } = req.body; // [{studentId, result: "PASS"|"FAIL", notes?}]

    if (!Array.isArray(grades) || grades.length === 0) {
        return next(new AppError('Please provide an array of grades', 400));
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));
    if (event.type !== 'BELT_EXAM') return next(new AppError('This is not a belt exam event', 400));

    const results: { studentId: string; name: string; result: string; targetBelt: string }[] = [];
    const errors: string[] = [];

    for (const grade of grades) {
        if (!['PASS', 'FAIL'].includes(grade.result)) {
            errors.push(`Invalid result "${grade.result}" for student ${grade.studentId}`);
            continue;
        }
        try {
            const outcome = await gradeOne(event, grade.studentId, grade.result, grade.notes || null, req.user);
            notifyPromotion(outcome, req.user);
            results.push({ studentId: grade.studentId, name: outcome.studentName, result: grade.result, targetBelt: outcome.to });
        } catch (err: unknown) {
            errors.push(`Error grading ${grade.studentId}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    res.status(200).json({
        status: 'success',
        message: `Graded ${results.length} of ${grades.length} students`,
        data: { results, errors },
    });
});
