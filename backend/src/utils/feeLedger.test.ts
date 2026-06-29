import { describe, it, expect } from 'vitest';
import { computeYearLedger, LedgerFeeRecord } from './feeLedger';

const TODAY = new Date('2026-06-15T00:00:00Z'); // June 2026

describe('computeYearLedger', () => {
  it('bills only from join month through current month, in the current year', () => {
    const join = new Date('2026-03-10T00:00:00Z'); // joined March
    const l = computeYearLedger(2026, join, 1000, [], TODAY);
    // Jan, Feb = NOT_DUE; Mar..Jun billable (4 months); Jul..Dec NOT_DUE
    expect(l.months.find((m) => m.month === 2)!.status).toBe('NOT_DUE');
    expect(l.months.find((m) => m.month === 3)!.status).toBe('UNPAID');
    expect(l.months.find((m) => m.month === 3)!.expected).toBe(1000);
    expect(l.months.find((m) => m.month === 7)!.status).toBe('NOT_DUE');
    expect(l.totals.totalExpected).toBe(4000);
    expect(l.totals.totalPaid).toBe(0);
    expect(l.totals.totalOutstanding).toBe(4000);
  });

  it('honours records: paid, partial, waived', () => {
    const join = new Date('2026-01-01T00:00:00Z');
    const records: LedgerFeeRecord[] = [
      { month: 3, amount: 1000, amountPaid: 1000, status: 'PAID' },
      { month: 4, amount: 1000, amountPaid: 400, status: 'PARTIAL' },
      { month: 5, amount: 1000, amountPaid: 0, status: 'WAIVED' },
    ];
    const l = computeYearLedger(2026, join, 1000, records, TODAY);
    expect(l.months.find((m) => m.month === 3)!.paid).toBe(1000);
    expect(l.months.find((m) => m.month === 4)!.expected).toBe(1000);
    expect(l.months.find((m) => m.month === 4)!.paid).toBe(400);
    expect(l.months.find((m) => m.month === 5)!.expected).toBe(0); // waived
    expect(l.months.find((m) => m.month === 5)!.status).toBe('WAIVED');
    // Jan,Feb,Jun unpaid at 1000 each = 3000; Mar paid 1000; Apr 1000; May waived 0
    expect(l.totals.totalExpected).toBe(5000);
    expect(l.totals.totalPaid).toBe(1400);
    expect(l.totals.totalOutstanding).toBe(3600);
  });

  it('bills all 12 months for a past year', () => {
    const join = new Date('2024-01-01T00:00:00Z');
    const l = computeYearLedger(2025, join, 500, [], TODAY);
    expect(l.totals.totalExpected).toBe(6000);
    expect(l.months.every((m) => m.status !== 'NOT_DUE')).toBe(true);
  });

  it('bills nothing for a future year', () => {
    const join = new Date('2024-01-01T00:00:00Z');
    const l = computeYearLedger(2027, join, 500, [], TODAY);
    expect(l.totals.totalExpected).toBe(0);
    expect(l.months.every((m) => m.status === 'NOT_DUE')).toBe(true);
  });

  it('treats a null dojo fee as 0 expected when no record exists', () => {
    const join = new Date('2026-01-01T00:00:00Z');
    const l = computeYearLedger(2026, join, null, [], TODAY);
    expect(l.totals.totalExpected).toBe(0);
    expect(l.months.find((m) => m.month === 1)!.status).toBe('UNPAID');
  });

  it('does not count amountPaid on a WAIVED record toward paid/outstanding', () => {
    const join = new Date('2026-01-01T00:00:00Z');
    const l = computeYearLedger(2026, join, 1000, [
      { month: 2, amount: 1000, amountPaid: 500, status: 'WAIVED' },
    ], TODAY);
    const feb = l.months.find((m) => m.month === 2)!;
    expect(feb.expected).toBe(0);
    expect(feb.paid).toBe(0);
    // Jan, Mar..Jun unpaid at 1000 = 5 months; Feb waived contributes 0
    expect(l.totals.totalPaid).toBe(0);
    expect(l.totals.totalExpected).toBe(5000);
  });

  it('bills full Jan-Dec for a past year even when the member joined mid-year of an earlier year', () => {
    const join = new Date('2024-06-10T00:00:00Z'); // joined June 2024
    const l = computeYearLedger(2025, join, 500, [], TODAY); // querying 2025 (past, after join year)
    expect(l.totals.totalExpected).toBe(6000); // 12 * 500
    expect(l.months.every((m) => m.status === 'UNPAID')).toBe(true);
  });
});
