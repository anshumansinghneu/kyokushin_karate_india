import { describe, it, expect } from 'vitest';
import { normalizeFeeUpdate } from './feeStatus';

const NOW = new Date('2026-06-22T00:00:00Z');

describe('normalizeFeeUpdate', () => {
  it('PAID sets amountPaid to full amount and stamps paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'PAID', amount: 800 }, NOW);
    expect(r).toEqual({ status: 'PAID', amount: 800, amountPaid: 800, paidAt: NOW });
  });

  it('UNPAID zeroes amountPaid and clears paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'UNPAID', amount: 800, amountPaid: 500 }, NOW);
    expect(r).toEqual({ status: 'UNPAID', amount: 800, amountPaid: 0, paidAt: null });
  });

  it('WAIVED zeroes amountPaid and clears paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'WAIVED', amount: 800 }, NOW);
    expect(r).toEqual({ status: 'WAIVED', amount: 800, amountPaid: 0, paidAt: null });
  });

  it('PARTIAL keeps a valid partial payment and stamps paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'PARTIAL', amount: 800, amountPaid: 300 }, NOW);
    expect(r).toEqual({ status: 'PARTIAL', amount: 800, amountPaid: 300, paidAt: NOW });
  });

  it('PARTIAL rejects amountPaid >= amount', () => {
    expect(() => normalizeFeeUpdate({ status: 'PARTIAL', amount: 800, amountPaid: 800 }, NOW)).toThrow();
  });

  it('PARTIAL rejects amountPaid <= 0', () => {
    expect(() => normalizeFeeUpdate({ status: 'PARTIAL', amount: 800, amountPaid: 0 }, NOW)).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => normalizeFeeUpdate({ status: 'PAID', amount: -1 }, NOW)).toThrow();
  });
});
