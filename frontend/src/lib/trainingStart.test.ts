import { describe, it, expect } from 'vitest';
import { trainingStartDate } from './trainingStart';

describe('trainingStartDate', () => {
  it('subtracts years of experience from the registration date', () => {
    const r = trainingStartDate('2026-06-16T00:00:00Z', 4, 0);
    expect(r.getUTCFullYear()).toBe(2022);
    expect(r.getUTCMonth()).toBe(5); // June
  });

  it('returns the registration date when there is no experience', () => {
    const r = trainingStartDate('2026-06-16T00:00:00Z', 0, 0);
    expect(r.getUTCFullYear()).toBe(2026);
    expect(r.getUTCMonth()).toBe(5);
  });

  it('subtracts months, crossing the year boundary', () => {
    const r = trainingStartDate('2026-06-16T00:00:00Z', 0, 6);
    expect(r.getUTCFullYear()).toBe(2025);
    expect(r.getUTCMonth()).toBe(11); // December
  });

  it('combines years and months', () => {
    const r = trainingStartDate('2026-06-16T00:00:00Z', 2, 3);
    expect(r.getUTCFullYear()).toBe(2024);
    expect(r.getUTCMonth()).toBe(2); // March
  });

  it('handles null/undefined experience safely', () => {
    const r = trainingStartDate('2026-06-16T00:00:00Z');
    expect(r.getUTCFullYear()).toBe(2026);
  });
});
