import { describe, it, expect } from 'vitest';
import { renderFeeReminderTemplate, shouldRemindStudent, monthName, DEFAULT_FEE_REMINDER_TEMPLATE } from './feeReminder';

describe('renderFeeReminderTemplate', () => {
  it('substitutes all known merge fields', () => {
    const out = renderFeeReminderTemplate('Hi {name}, ₹{amount} for {month} {year} at {dojoName} due {dueDate}', {
      name: 'Riku', amount: 800, month: 'June', year: 2026, dojoName: 'Mumbai Dojo', dueDate: '10 June 2026',
    });
    expect(out).toBe('Hi Riku, ₹800 for June 2026 at Mumbai Dojo due 10 June 2026');
  });

  it('leaves unknown placeholders untouched', () => {
    const out = renderFeeReminderTemplate('Hi {name} {unknown}', {
      name: 'Riku', amount: 1, month: 'June', year: 2026, dojoName: 'D', dueDate: 'x',
    });
    expect(out).toBe('Hi Riku {unknown}');
  });

  it('default template references name and amount', () => {
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{name}');
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{amount}');
  });
});

describe('monthName', () => {
  it('maps 1-12 to names', () => {
    expect(monthName(1)).toBe('January');
    expect(monthName(6)).toBe('June');
    expect(monthName(12)).toBe('December');
  });
});

describe('shouldRemindStudent', () => {
  const base = { feeDueDay: 10, today: new Date('2026-06-15T00:00:00Z'), lastReminderAt: null as Date | null };

  it('reminds an unpaid student past the due day with no prior reminder', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID' })).toBe(true);
  });

  it('reminds a partial payer', () => {
    expect(shouldRemindStudent({ ...base, status: 'PARTIAL' })).toBe(true);
  });

  it('never reminds PAID or WAIVED', () => {
    expect(shouldRemindStudent({ ...base, status: 'PAID' })).toBe(false);
    expect(shouldRemindStudent({ ...base, status: 'WAIVED' })).toBe(false);
  });

  it('does not remind before the due day', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID', today: new Date('2026-06-05T00:00:00Z') })).toBe(false);
  });

  it('throttles within the throttle window', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID', lastReminderAt: new Date('2026-06-13T00:00:00Z') })).toBe(false);
  });

  it('reminds again after the throttle window', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID', lastReminderAt: new Date('2026-06-08T00:00:00Z') })).toBe(true);
  });
});
