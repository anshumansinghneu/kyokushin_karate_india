import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendBeltPromotionEmail } from '../services/emailService';

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
            event: { id: event.id, name: event.name, startDate: event.startDate, status: event.status },
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

// ─── Grade a student: PASS or FAIL ──────────────────────────────────
export const gradeStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, studentId } = req.params;
    const { result, notes } = req.body; // result = "PASS" | "FAIL"
    const currentUser = req.user;

    if (!['PASS', 'FAIL'].includes(result)) {
        return next(new AppError('Result must be PASS or FAIL', 400));
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));
    if (event.type !== 'BELT_EXAM') return next(new AppError('This is not a belt exam event', 400));

    // Check student is registered
    const registration = await prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId: studentId } },
    });
    if (!registration) return next(new AppError('Student is not registered for this exam', 404));
    if (registration.approvalStatus !== 'APPROVED') return next(new AppError('Registration is not approved', 400));

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return next(new AppError('Student not found', 404));

    const currentBelt = student.currentBeltRank || 'White';
    const targetBelt = getNextBelt(currentBelt);

    if (!targetBelt) return next(new AppError('Student is already at the highest belt rank', 400));

    // Upsert exam result (allows re-grading)
    const examResult = await prisma.beltExamResult.upsert({
        where: { eventId_studentId: { eventId, studentId } },
        update: {
            result,
            notes: notes || null,
            gradedBy: currentUser.id,
            gradedAt: new Date(),
        },
        create: {
            eventId,
            studentId,
            currentBelt,
            targetBelt,
            result,
            notes: notes || null,
            gradedBy: currentUser.id,
            gradedAt: new Date(),
        },
    });

    // If PASS → auto-promote the student
    if (result === 'PASS') {
        await prisma.$transaction(async (tx: any) => {
            // Update user belt
            await tx.user.update({
                where: { id: studentId },
                data: { currentBeltRank: targetBelt },
            });

            // Create belt history record
            await tx.beltHistory.create({
                data: {
                    studentId,
                    oldBelt: currentBelt,
                    newBelt: targetBelt,
                    promotedBy: currentUser.id,
                    promotionDate: event.startDate, // Use exam date
                    notes: `Belt exam: ${event.name}${notes ? ` — ${notes}` : ''}`,
                },
            });
        });

        // Send promotion email (non-blocking)
        sendBeltPromotionEmail(student.email, student.name, targetBelt, currentUser.name || 'Sensei').catch(() => {});
    }

    res.status(200).json({
        status: 'success',
        message: result === 'PASS'
            ? `${student.name} promoted from ${currentBelt} to ${targetBelt}`
            : `${student.name} did not pass the belt exam`,
        data: { examResult },
    });
});

// ─── Bulk grade students ────────────────────────────────────────────
export const bulkGradeStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { grades } = req.body; // [{studentId, result: "PASS"|"FAIL", notes?}]
    const currentUser = req.user;

    if (!Array.isArray(grades) || grades.length === 0) {
        return next(new AppError('Please provide an array of grades', 400));
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));
    if (event.type !== 'BELT_EXAM') return next(new AppError('This is not a belt exam event', 400));

    const results: any[] = [];
    const errors: string[] = [];

    for (const grade of grades) {
        if (!['PASS', 'FAIL'].includes(grade.result)) {
            errors.push(`Invalid result "${grade.result}" for student ${grade.studentId}`);
            continue;
        }

        try {
            const student = await prisma.user.findUnique({ where: { id: grade.studentId } });
            if (!student) { errors.push(`Student ${grade.studentId} not found`); continue; }

            const registration = await prisma.eventRegistration.findUnique({
                where: { eventId_userId: { eventId, userId: grade.studentId } },
            });
            if (!registration || registration.approvalStatus !== 'APPROVED') {
                errors.push(`Student ${student.name} is not approved for this exam`);
                continue;
            }

            const currentBelt = student.currentBeltRank || 'White';
            const targetBelt = getNextBelt(currentBelt);
            if (!targetBelt) { errors.push(`${student.name} is at max belt rank`); continue; }

            const examResult = await prisma.beltExamResult.upsert({
                where: { eventId_studentId: { eventId, studentId: grade.studentId } },
                update: { result: grade.result, notes: grade.notes || null, gradedBy: currentUser.id, gradedAt: new Date() },
                create: {
                    eventId, studentId: grade.studentId, currentBelt, targetBelt,
                    result: grade.result, notes: grade.notes || null,
                    gradedBy: currentUser.id, gradedAt: new Date(),
                },
            });

            if (grade.result === 'PASS') {
                await prisma.$transaction(async (tx: any) => {
                    await tx.user.update({ where: { id: grade.studentId }, data: { currentBeltRank: targetBelt } });
                    await tx.beltHistory.create({
                        data: {
                            studentId: grade.studentId, oldBelt: currentBelt, newBelt: targetBelt,
                            promotedBy: currentUser.id, promotionDate: event.startDate,
                            notes: `Belt exam: ${event.name}${grade.notes ? ` — ${grade.notes}` : ''}`,
                        },
                    });
                });
                sendBeltPromotionEmail(student.email, student.name, targetBelt, currentUser.name || 'Sensei').catch(() => {});
            }

            results.push({ studentId: grade.studentId, name: student.name, result: grade.result, targetBelt });
        } catch (err: any) {
            errors.push(`Error grading ${grade.studentId}: ${err.message}`);
        }
    }

    res.status(200).json({
        status: 'success',
        message: `Graded ${results.length} of ${grades.length} students`,
        data: { results, errors },
    });
});
