import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { normalizeFeeUpdate, FeeStatus } from '../utils/feeStatus';
import { remindDojo } from '../services/feeReminderService';

// GET /api/fees/dojo/:dojoId?month=&year=
export const getDojoFees = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
    select: { id: true, name: true, membershipNumber: true, currentBeltRank: true, membershipStatus: true },
    orderBy: { name: 'asc' },
  });

  const fees = await prisma.monthlyFee.findMany({
    where: { dojoId, month, year, userId: { in: students.map((s) => s.id) } },
  });
  const feeByUser = new Map(fees.map((f) => [f.userId, f]));

  const dojo = await prisma.dojo.findUnique({ where: { id: dojoId }, select: { monthlyFee: true, feeDueDay: true, feeReminderTemplate: true } });

  const roster = students.map((student) => ({ student, fee: feeByUser.get(student.id) ?? null }));

  res.status(200).json({ status: 'success', data: { monthlyFee: dojo?.monthlyFee ?? null, feeDueDay: dojo?.feeDueDay ?? 10, feeReminderTemplate: dojo?.feeReminderTemplate ?? null, roster } });
});

// POST /api/fees/mark
export const markFee = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { userId, dojoId, month, year, status, amount, amountPaid, method, notes } = req.body;
  if (!userId || !dojoId || !month || !year || !status) {
    return next(new AppError('userId, dojoId, month, year and status are required', 400));
  }
  const m = parseInt(month);
  const y = parseInt(year);
  if (m < 1 || m > 12) return next(new AppError('month must be 1-12', 400));

  const student = await prisma.user.findUnique({ where: { id: userId }, select: { primaryInstructorId: true, dojoId: true } });
  if (!student) return next(new AppError('Student not found', 404));
  if (currentUser.role !== 'ADMIN' && student.primaryInstructorId !== currentUser.id) {
    return next(new AppError('You can only manage your own students', 403));
  }
  if (student.dojoId !== dojoId) {
    return next(new AppError('Student does not belong to this dojo', 400));
  }

  let feeAmount: number;
  if (amount !== undefined && amount !== null && amount !== '') {
    feeAmount = parseFloat(amount);
  } else {
    const dojo = await prisma.dojo.findUnique({ where: { id: dojoId }, select: { monthlyFee: true } });
    feeAmount = dojo?.monthlyFee ?? 0;
  }

  let normalized;
  try {
    normalized = normalizeFeeUpdate({
      status: status as FeeStatus,
      amount: feeAmount,
      amountPaid: amountPaid !== undefined && amountPaid !== null && amountPaid !== '' ? parseFloat(amountPaid) : undefined,
    });
  } catch (e: any) {
    return next(new AppError(e.message, 400));
  }

  const fee = await prisma.monthlyFee.upsert({
    where: { userId_month_year: { userId, month: m, year: y } },
    create: {
      userId, dojoId, month: m, year: y,
      ...normalized,
      method: method ?? null,
      notes: notes ?? null,
      markedBy: currentUser.id,
    },
    update: {
      ...normalized,
      method: method ?? null,
      notes: notes ?? null,
      markedBy: currentUser.id,
    },
  });

  res.status(200).json({ status: 'success', data: { fee } });
});

// GET /api/fees/me
export const getMyFees = catchAsync(async (req: Request, res: Response) => {
  const fees = await prisma.monthlyFee.findMany({
    where: { userId: req.user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.status(200).json({ status: 'success', data: { fees } });
});

// POST /api/fees/remind
export const remindUnpaid = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId, month, year } = req.body;
  if (!dojoId || !month || !year) {
    return next(new AppError('dojoId, month and year are required', 400));
  }

  if (currentUser.role !== 'ADMIN') {
    const teaches = await prisma.user.findFirst({
      where: { dojoId, primaryInstructorId: currentUser.id },
      select: { id: true },
    });
    if (!teaches) return next(new AppError('You can only send reminders for your own dojo', 403));
  }

  const instructorId = currentUser.role !== 'ADMIN' ? currentUser.id : undefined;
  const result = await remindDojo(dojoId, parseInt(month), parseInt(year), new Date(), instructorId);
  res.status(200).json({ status: 'success', data: result });
});

// PATCH /api/fees/dojo-settings — instructor/admin set fee config for their OWN dojo
// (narrow alternative to the admin-only PATCH /dojos/:id)
export const updateDojoFeeSettings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId, monthlyFee, feeDueDay, feeReminderTemplate } = req.body;
  if (!dojoId) return next(new AppError('dojoId is required', 400));

  if (currentUser.role !== 'ADMIN' && currentUser.dojoId !== dojoId) {
    return next(new AppError('You can only update fee settings for your own dojo', 403));
  }

  const data: any = {};
  if (monthlyFee !== undefined) {
    data.monthlyFee = monthlyFee === null || monthlyFee === '' ? null : parseFloat(monthlyFee);
  }
  if (feeDueDay !== undefined) {
    const d = parseInt(feeDueDay);
    if (Number.isNaN(d) || d < 1 || d > 28) return next(new AppError('feeDueDay must be between 1 and 28', 400));
    data.feeDueDay = d;
  }
  if (feeReminderTemplate !== undefined) {
    data.feeReminderTemplate = feeReminderTemplate === '' ? null : feeReminderTemplate;
  }

  try {
    const dojo = await prisma.dojo.update({
      where: { id: dojoId },
      data,
      select: { id: true, monthlyFee: true, feeDueDay: true, feeReminderTemplate: true },
    });
    res.status(200).json({ status: 'success', data: { dojo } });
  } catch (error: any) {
    if (error.code === 'P2025') return next(new AppError('No dojo found with that ID', 404));
    throw error;
  }
});
