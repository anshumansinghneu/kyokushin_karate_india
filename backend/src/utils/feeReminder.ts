import type { FeeStatus } from './feeStatus';

export const DEFAULT_FEE_REMINDER_TEMPLATE =
  'Osu {name}, your {month} {year} training fee of ₹{amount} for {dojoName} is due (by {dueDate}). ' +
  'Please clear it at your earliest convenience. Osu!';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

export interface FeeReminderVars {
  name: string;
  amount: number | string;
  month: string;
  year: number | string;
  dojoName: string;
  dueDate: string;
}

export function renderFeeReminderTemplate(template: string, vars: FeeReminderVars): string {
  const map: Record<string, string> = {
    name: String(vars.name),
    amount: String(vars.amount),
    month: String(vars.month),
    year: String(vars.year),
    dojoName: String(vars.dojoName),
    dueDate: String(vars.dueDate),
  };
  return template.replace(/\{(\w+)\}/g, (full, key) => (key in map ? map[key] : full));
}

export interface RemindDecisionInput {
  status: FeeStatus;
  lastReminderAt: Date | null;
  feeDueDay: number;
  today: Date;
  throttleDays?: number;
}

export function shouldRemindStudent(i: RemindDecisionInput): boolean {
  if (i.status === 'PAID' || i.status === 'WAIVED') return false;
  if (i.today.getDate() < i.feeDueDay) return false;
  if (i.lastReminderAt) {
    const days = (i.today.getTime() - i.lastReminderAt.getTime()) / 86_400_000;
    if (days < (i.throttleDays ?? 5)) return false;
  }
  return true;
}
