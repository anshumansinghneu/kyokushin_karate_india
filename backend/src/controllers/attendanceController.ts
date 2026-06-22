import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

// GET /api/attendance/dojo/:dojoId?month=&year=
export const getDojoAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId } = req.params;
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);
  if (!month || !year || month < 1 || month > 12) {
    return next(new AppError('Valid month (1-12) and year query params are required', 400));
  }

  const where: any = { role: 'STUDENT', dojoId };
  if (currentUser.role !== 'ADMIN') where.primaryInstructorId = currentUser.id;

  const students = await prisma.user.findMany({
    where,
    select: { id: true, name: true, membershipNumber: true, currentBeltRank: true },
    orderBy: { name: 'asc' },
  });

  const records = await prisma.monthlyAttendance.findMany({
    where: { dojoId, month, year, userId: { in: students.map((s) => s.id) } },
  });
  const byUser = new Map(records.map((r) => [r.userId, r]));

  const roster = students.map((student) => ({ student, attendance: byUser.get(student.id) ?? null }));
  res.status(200).json({ status: 'success', data: { roster } });
});

// POST /api/attendance/mark
export const markAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId, month, year, entries } = req.body;
  if (!dojoId || !month || !year || !Array.isArray(entries)) {
    return next(new AppError('dojoId, month, year and entries[] are required', 400));
  }
  const m = parseInt(month);
  const y = parseInt(year);
  if (m < 1 || m > 12) return next(new AppError('month must be 1-12', 400));
  if (entries.length === 0) return next(new AppError('entries[] must not be empty', 400));

  const ids: string[] = entries.map((e: any) => e.userId);

  if (currentUser.role !== 'ADMIN') {
    const owned = await prisma.user.findMany({
      where: { id: { in: ids }, primaryInstructorId: currentUser.id },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((o) => o.id));
    if (!ids.every((id) => ownedSet.has(id))) {
      return next(new AppError('You can only manage your own students', 403));
    }
  }

  const attendance = await prisma.$transaction(
    entries.map((e: any) =>
      prisma.monthlyAttendance.upsert({
        where: { userId_month_year: { userId: e.userId, month: m, year: y } },
        create: {
          userId: e.userId, dojoId, month: m, year: y,
          classesAttended: parseInt(e.classesAttended) || 0,
          notes: e.notes ?? null,
          markedBy: currentUser.id,
        },
        update: {
          classesAttended: parseInt(e.classesAttended) || 0,
          notes: e.notes ?? null,
          markedBy: currentUser.id,
        },
      })
    )
  );

  res.status(200).json({ status: 'success', results: attendance.length, data: { attendance } });
});

// GET /api/attendance/me
export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const attendance = await prisma.monthlyAttendance.findMany({
    where: { userId: req.user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.status(200).json({ status: 'success', data: { attendance } });
});
