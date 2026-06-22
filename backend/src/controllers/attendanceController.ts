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

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, month, 1));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      dojoId,
      userId: { in: students.map((s) => s.id) },
      date: { gte: monthStart, lt: nextMonthStart },
    },
  });

  const daysByUser = new Map<string, Record<string, string>>();
  for (const r of records) {
    const day = String(new Date(r.date).getUTCDate());
    const m = daysByUser.get(r.userId) ?? {};
    m[day] = r.status;
    daysByUser.set(r.userId, m);
  }

  const roster = students.map((student) => {
    const days = daysByUser.get(student.id) ?? {};
    const presentCount = Object.values(days).filter((s) => s === 'PRESENT').length;
    return { student, days, presentCount };
  });

  res.status(200).json({ status: 'success', data: { roster } });
});

// POST /api/attendance/mark  — body: { userId, dojoId, year, month, day, status }
export const markAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { userId, dojoId, year, month, day, status } = req.body;
  if (!userId || !dojoId || !year || !month || !day) {
    return next(new AppError('userId, dojoId, year, month and day are required', 400));
  }
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);
  if (m < 1 || m > 12) return next(new AppError('month must be 1-12', 400));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d < 1 || d > daysInMonth) return next(new AppError('day is out of range for that month', 400));

  const clearing = status === null || status === 'CLEAR' || status === undefined;
  if (!clearing && status !== 'PRESENT' && status !== 'ABSENT') {
    return next(new AppError('status must be PRESENT, ABSENT, or null to clear', 400));
  }

  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { primaryInstructorId: true, dojoId: true },
  });
  if (!student) return next(new AppError('Student not found', 404));
  if (currentUser.role !== 'ADMIN' && student.primaryInstructorId !== currentUser.id) {
    return next(new AppError('You can only manage your own students', 403));
  }
  if (student.dojoId !== dojoId) {
    return next(new AppError('Student does not belong to this dojo', 400));
  }

  const date = new Date(Date.UTC(y, m - 1, d));

  if (clearing) {
    await prisma.attendanceRecord.deleteMany({ where: { userId, date } });
    return res.status(200).json({ status: 'success', data: { record: null } });
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, dojoId, date, status, markedBy: currentUser.id },
    update: { status, markedBy: currentUser.id },
  });

  res.status(200).json({ status: 'success', data: { record } });
});

// GET /api/attendance/me
export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const attendance = await prisma.attendanceRecord.findMany({
    where: { userId: req.user.id },
    orderBy: { date: 'desc' },
  });
  res.status(200).json({ status: 'success', data: { attendance } });
});
