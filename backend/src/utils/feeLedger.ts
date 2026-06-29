import type { FeeStatus } from './feeStatus';

export type LedgerMonthStatus = FeeStatus | 'NOT_DUE';

export interface LedgerFeeRecord {
  month: number; // 1-12
  amount: number;
  amountPaid: number;
  status: FeeStatus;
}

export interface LedgerMonth {
  month: number; // 1-12
  expected: number;
  paid: number;
  status: LedgerMonthStatus;
}

export interface YearLedger {
  months: LedgerMonth[];
  totals: { totalExpected: number; totalPaid: number; totalOutstanding: number };
}

export function computeYearLedger(
  year: number,
  joinDate: Date,
  dojoMonthlyFee: number | null,
  feeRecords: LedgerFeeRecord[],
  today: Date = new Date()
): YearLedger {
  const fee = dojoMonthlyFee ?? 0;
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // First billable month within this year.
  let firstMonth: number;
  if (year < joinYear) firstMonth = 13; // nothing billable
  else if (year === joinYear) firstMonth = joinMonth;
  else firstMonth = 1;

  // Last billable month within this year.
  let lastMonth: number;
  if (year > currentYear) lastMonth = 0; // future year, nothing billable
  else if (year === currentYear) lastMonth = currentMonth;
  else lastMonth = 12;

  const recordByMonth = new Map(feeRecords.map((r) => [r.month, r]));

  const months: LedgerMonth[] = [];
  let totalExpected = 0;
  let totalPaid = 0;

  for (let m = 1; m <= 12; m++) {
    const billable = m >= firstMonth && m <= lastMonth;
    if (!billable) {
      months.push({ month: m, expected: 0, paid: 0, status: 'NOT_DUE' });
      continue;
    }
    const rec = recordByMonth.get(m);
    if (rec) {
      const expected = rec.status === 'WAIVED' ? 0 : rec.amount;
      months.push({ month: m, expected, paid: rec.amountPaid, status: rec.status });
      totalExpected += expected;
      totalPaid += rec.amountPaid;
    } else {
      months.push({ month: m, expected: fee, paid: 0, status: 'UNPAID' });
      totalExpected += fee;
    }
  }

  return {
    months,
    totals: {
      totalExpected,
      totalPaid,
      totalOutstanding: Math.max(totalExpected - totalPaid, 0),
    },
  };
}
