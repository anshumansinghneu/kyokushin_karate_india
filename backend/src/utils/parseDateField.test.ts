import { describe, it, expect } from 'vitest';
import { parseDateField, parseOptionalDateField, parseEventDates } from './parseDateField';

describe('parseDateField', () => {
    it('accepts a plausible ISO date', () => {
        expect(parseDateField('2026-05-03', 'startDate').toISOString()).toBe('2026-05-03T00:00:00.000Z');
    });

    it('accepts a Date object', () => {
        expect(parseDateField(new Date('2026-05-03T00:00:00Z'), 'startDate').getUTCFullYear()).toBe(2026);
    });

    it('rejects the exact production corruption: a year-0002 date', () => {
        // An event was stored with registrationDeadline = 0002-04-26.
        expect(() => parseDateField('0002-04-26', 'registrationDeadline'))
            .toThrow(/implausible year \(2\)/);
    });

    it('rejects a year past the upper bound', () => {
        expect(() => parseDateField('2999-01-01', 'startDate')).toThrow(/implausible year/);
    });

    it('rejects unparseable input', () => {
        expect(() => parseDateField('not-a-date', 'startDate')).toThrow(/not a valid date/);
    });

    it('rejects missing input', () => {
        expect(() => parseDateField(undefined, 'startDate')).toThrow(/required/);
        expect(() => parseDateField('', 'startDate')).toThrow(/required/);
    });
});

describe('parseOptionalDateField', () => {
    it('returns undefined for absent values', () => {
        expect(parseOptionalDateField(undefined, 'endDate')).toBeUndefined();
        expect(parseOptionalDateField(null, 'endDate')).toBeUndefined();
        expect(parseOptionalDateField('', 'endDate')).toBeUndefined();
    });

    it('still validates a value that is present', () => {
        expect(() => parseOptionalDateField('0002-04-26', 'endDate')).toThrow(/implausible year/);
    });
});

describe('parseEventDates', () => {
    it('defaults endDate and registrationDeadline to startDate', () => {
        const r = parseEventDates({ startDate: '2026-05-03' });
        expect(r.endDate).toEqual(r.startDate);
        expect(r.registrationDeadline).toEqual(r.startDate);
    });

    it('keeps a valid multi-day range', () => {
        const r = parseEventDates({
            startDate: '2026-05-03', endDate: '2026-05-05', registrationDeadline: '2026-04-26',
        });
        expect(r.startDate.toISOString()).toBe('2026-05-03T00:00:00.000Z');
        expect(r.endDate.toISOString()).toBe('2026-05-05T00:00:00.000Z');
        expect(r.registrationDeadline.toISOString()).toBe('2026-04-26T00:00:00.000Z');
    });

    it('rejects an end date before the start', () => {
        expect(() => parseEventDates({ startDate: '2026-05-05', endDate: '2026-05-03' }))
            .toThrow(/endDate cannot be before startDate/);
    });

    it('rejects a deadline after the event ends', () => {
        expect(() => parseEventDates({
            startDate: '2026-05-03', endDate: '2026-05-05', registrationDeadline: '2026-06-01',
        })).toThrow(/registrationDeadline cannot be after/);
    });

    it('rejects a corrupt deadline even when the other dates are fine', () => {
        expect(() => parseEventDates({
            startDate: '2026-05-03', endDate: '2026-05-05', registrationDeadline: '0002-04-26',
        })).toThrow(/implausible year/);
    });
});
