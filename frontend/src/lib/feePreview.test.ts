import { describe, it, expect } from 'vitest';
import { renderFeePreview, DEFAULT_FEE_REMINDER_TEMPLATE } from './feePreview';

describe('renderFeePreview', () => {
  it('substitutes merge fields', () => {
    const out = renderFeePreview('Hi {name}, ₹{amount} for {month}', {
      name: 'Riku', amount: 800, month: 'June', year: 2026, dojoName: 'D', dueDate: 'x',
    });
    expect(out).toBe('Hi Riku, ₹800 for June');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(renderFeePreview('{name} {nope}', { name: 'A', amount: 1, month: 'm', year: 1, dojoName: 'd', dueDate: 'x' }))
      .toBe('A {nope}');
  });

  it('default template mentions name and amount', () => {
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{name}');
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{amount}');
  });
});
