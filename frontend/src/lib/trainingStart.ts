/**
 * Derive when a student actually started training, by subtracting their declared
 * prior experience from their registration date. A 4-year veteran who registers
 * in 2026 started training in ~2022 — not on their signup date.
 */
export function trainingStartDate(
  createdAt: string | Date,
  experienceYears?: number | null,
  experienceMonths?: number | null,
): Date {
  const d = new Date(createdAt);
  d.setUTCFullYear(d.getUTCFullYear() - (experienceYears || 0));
  d.setUTCMonth(d.getUTCMonth() - (experienceMonths || 0));
  return d;
}
