// Validated parsing for user-supplied date fields.
//
// Event dates were previously fed straight into `new Date(value)` with no sanity
// check, so a mistyped year was persisted verbatim: production held an event
// whose registrationDeadline was stored as year 0002. `new Date()` is extremely
// permissive — it happily accepts "0002-04-26" and silently coerces plenty of
// nonsense — so the range has to be asserted explicitly.

import { AppError } from './errorHandler';

/** Calendar years outside this range are treated as data-entry errors. */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

/**
 * Parse a required date field. Throws AppError(400) when the value is missing,
 * unparseable, or outside [MIN_YEAR, MAX_YEAR].
 */
export function parseDateField(value: unknown, fieldName: string): Date {
    if (value === null || value === undefined || value === '') {
        throw new AppError(`${fieldName} is required`, 400);
    }
    const d = value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
    if (Number.isNaN(d.getTime())) {
        throw new AppError(`${fieldName} is not a valid date`, 400);
    }
    const year = d.getUTCFullYear();
    if (year < MIN_YEAR || year > MAX_YEAR) {
        throw new AppError(
            `${fieldName} has an implausible year (${year}). Expected between ${MIN_YEAR} and ${MAX_YEAR}.`,
            400
        );
    }
    return d;
}

/** As parseDateField, but an absent value yields undefined instead of throwing. */
export function parseOptionalDateField(value: unknown, fieldName: string): Date | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    return parseDateField(value, fieldName);
}

/**
 * Cross-field validation for an event's date triple. Returns the resolved dates,
 * defaulting endDate and registrationDeadline to startDate as the controllers did.
 */
export function parseEventDates(input: {
    startDate: unknown;
    endDate?: unknown;
    registrationDeadline?: unknown;
}): { startDate: Date; endDate: Date; registrationDeadline: Date } {
    const startDate = parseDateField(input.startDate, 'startDate');
    const endDate = parseOptionalDateField(input.endDate, 'endDate') ?? startDate;
    const registrationDeadline =
        parseOptionalDateField(input.registrationDeadline, 'registrationDeadline') ?? startDate;

    if (endDate < startDate) {
        throw new AppError('endDate cannot be before startDate', 400);
    }
    if (registrationDeadline > endDate) {
        throw new AppError('registrationDeadline cannot be after the event ends', 400);
    }
    return { startDate, endDate, registrationDeadline };
}
