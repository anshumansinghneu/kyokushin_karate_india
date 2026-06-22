export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export function nextStatus(current: AttendanceStatus | null): AttendanceStatus | null {
  if (current === null) return 'PRESENT';
  if (current === 'PRESENT') return 'ABSENT';
  return null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function countPresent(days: Record<string, string>): number {
  return Object.values(days).filter((s) => s === 'PRESENT').length;
}
