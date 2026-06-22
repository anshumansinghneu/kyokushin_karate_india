export type FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED';

export interface FeeUpdateInput {
  status: FeeStatus;
  amount: number;
  amountPaid?: number;
}

export interface NormalizedFee {
  status: FeeStatus;
  amount: number;
  amountPaid: number;
  paidAt: Date | null;
}

export function normalizeFeeUpdate(input: FeeUpdateInput, now: Date = new Date()): NormalizedFee {
  const { status, amount } = input;
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
    throw new Error('amount must be a number >= 0');
  }
  switch (status) {
    case 'PAID':
      return { status, amount, amountPaid: amount, paidAt: now };
    case 'UNPAID':
    case 'WAIVED':
      return { status, amount, amountPaid: 0, paidAt: null };
    case 'PARTIAL': {
      const amountPaid = input.amountPaid ?? 0;
      if (amountPaid <= 0 || amountPaid >= amount) {
        throw new Error('PARTIAL requires 0 < amountPaid < amount');
      }
      return { status, amount, amountPaid, paidAt: now };
    }
    default:
      throw new Error(`Unknown fee status: ${status}`);
  }
}
