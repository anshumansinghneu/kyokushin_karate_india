import { describe, it, expect } from 'vitest';
import { renderFeeReceiptTemplate, DEFAULT_FEE_RECEIPT_TEMPLATE } from './feeReceipt';

const base = {
  name: 'Riku', dojoName: 'Honbu Dojo', month: 'June', year: 2026,
  amountPaid: 1000, amount: 1000, method: 'UPI', date: '15 June 2026',
};

describe('renderFeeReceiptTemplate', () => {
  it('renders a full-payment receipt with no pending note', () => {
    const msg = renderFeeReceiptTemplate(DEFAULT_FEE_RECEIPT_TEMPLATE, { ...base, outstanding: 0 });
    expect(msg).toContain('Riku');
    expect(msg).toContain('₹1000');
    expect(msg).toContain('June 2026');
    expect(msg).not.toContain('pending');
  });

  it('renders a partial-payment receipt with the pending note', () => {
    const msg = renderFeeReceiptTemplate(DEFAULT_FEE_RECEIPT_TEMPLATE, {
      ...base, amountPaid: 400, outstanding: 600,
    });
    expect(msg).toContain('₹400');
    expect(msg).toContain('₹600');
    expect(msg).toContain('pending');
  });

  it('substitutes custom merge fields and leaves unknown braces intact', () => {
    const msg = renderFeeReceiptTemplate('{name} paid {amountPaid} via {method} {unknown}', {
      ...base, amountPaid: 250, outstanding: 0,
    });
    expect(msg).toBe('Riku paid 250 via UPI {unknown}');
  });
});
