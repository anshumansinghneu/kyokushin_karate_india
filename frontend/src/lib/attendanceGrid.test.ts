import { describe, it, expect } from 'vitest';
import { nextStatus, daysInMonth, countPresent } from './attendanceGrid';

describe('nextStatus', () => {
  it('cycles empty -> PRESENT -> ABSENT -> empty', () => {
    expect(nextStatus(null)).toBe('PRESENT');
    expect(nextStatus('PRESENT')).toBe('ABSENT');
    expect(nextStatus('ABSENT')).toBe(null);
  });
});

describe('daysInMonth', () => {
  it('returns 30 for June 2026', () => {
    expect(daysInMonth(2026, 6)).toBe(30);
  });
  it('returns 31 for January 2026', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
  });
  it('handles leap February', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });
});

describe('countPresent', () => {
  it('counts only PRESENT values', () => {
    expect(countPresent({ '1': 'PRESENT', '2': 'ABSENT', '3': 'PRESENT' })).toBe(2);
  });
  it('returns 0 for an empty map', () => {
    expect(countPresent({})).toBe(0);
  });
});
