import prisma from '../prisma';
import { sendFeeReminderEmail } from './emailService';
import {
  renderFeeReminderTemplate,
  shouldRemindStudent,
  monthName,
  DEFAULT_FEE_REMINDER_TEMPLATE,
} from '../utils/feeReminder';
import type { FeeStatus } from '../utils/feeStatus';

/** Send reminders to unpaid/partial active students of one dojo for a given month. */
export async function remindDojo(
  dojoId: string,
  month: number,
  year: number,
  today: Date = new Date(),
  instructorId?: string
): Promise<{ sent: number; skipped: number; errors: number }> {
  const result = { sent: 0, skipped: 0, errors: 0 };

  const dojo = await prisma.dojo.findUnique({ where: { id: dojoId } });
  if (!dojo || dojo.monthlyFee == null) return result;

  const studentWhere: any = { dojoId, role: 'STUDENT', membershipStatus: 'ACTIVE' };
  if (instructorId) studentWhere.primaryInstructorId = instructorId;
  const students = await prisma.user.findMany({
    where: studentWhere,
    select: { id: true, name: true, email: true },
  });

  const fees = await prisma.monthlyFee.findMany({ where: { dojoId, month, year } });
  const feeByUser = new Map(fees.map((f) => [f.userId, f]));

  const dueDateStr = new Date(year, month - 1, dojo.feeDueDay).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const template = dojo.feeReminderTemplate || DEFAULT_FEE_REMINDER_TEMPLATE;

  for (const student of students) {
    const fee = feeByUser.get(student.id) ?? null;
    const status = (fee?.status ?? 'UNPAID') as FeeStatus;

    if (!shouldRemindStudent({ status, lastReminderAt: fee?.lastReminderAt ?? null, feeDueDay: dojo.feeDueDay, today })) {
      result.skipped++;
      continue;
    }

    try {
      const message = renderFeeReminderTemplate(template, {
        name: student.name,
        amount: dojo.monthlyFee,
        month: monthName(month),
        year,
        dojoName: dojo.name,
        dueDate: dueDateStr,
      });

      await sendFeeReminderEmail(student.email, student.name, message);

      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'FEE_REMINDER',
          title: `Fee due — ${monthName(month)} ${year}`,
          message,
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      await prisma.monthlyFee.upsert({
        where: { userId_month_year: { userId: student.id, month, year } },
        create: {
          userId: student.id, dojoId, month, year,
          amount: dojo.monthlyFee, status: 'UNPAID', markedBy: 'SYSTEM',
          remindersSent: 1, lastReminderAt: today,
        },
        update: { remindersSent: { increment: 1 }, lastReminderAt: today },
      });

      console.log(`[FEE-REMINDER] Sent to ${student.email}`);
      result.sent++;
    } catch (err) {
      console.error(`[FEE-REMINDER] Failed for ${student.email}:`, err);
      result.errors++;
    }
  }

  return result;
}

/** Cron entry point: remind across all dojos with a configured fee, for the current month. */
export async function sendFeeRemindersAllDojos(
  today: Date = new Date()
): Promise<{ dojos: number; sent: number; skipped: number; errors: number }> {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const dojos = await prisma.dojo.findMany({ where: { monthlyFee: { not: null } }, select: { id: true } });
  const totals = { dojos: dojos.length, sent: 0, skipped: 0, errors: 0 };

  for (const d of dojos) {
    const r = await remindDojo(d.id, month, year, today);
    totals.sent += r.sent;
    totals.skipped += r.skipped;
    totals.errors += r.errors;
  }

  console.log(`[FEE-REMINDER] dojos=${totals.dojos} sent=${totals.sent} skipped=${totals.skipped} errors=${totals.errors}`);
  return totals;
}
