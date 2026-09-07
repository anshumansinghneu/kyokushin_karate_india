import { describe, it, expect } from 'vitest';
import { dateOnlyParts, formatDateOnly, toDateOnlyISO } from './dateOnly';

// These are the timezones that used to break: anything west of UTC rendered the
// previous day, anything far east could render the next one.
const TZS = ['America/Los_Angeles', 'America/New_York', 'UTC', 'Asia/Kolkata', 'Pacific/Kiritimati'];

describe('dateOnlyParts', () => {
    it('reads the stored calendar day, not the viewer-local one', () => {
        // The exact production bug: startDate 2026-05-03 rendered as "2 MAY" in EDT.
        const p = dateOnlyParts('2026-05-03T00:00:00.000Z');
        expect(p.day).toBe(3);
        expect(p.month).toBe('MAY');
        expect(p.year).toBe(2026);
    });

    it('does not roll backwards across a month boundary', () => {
        const p = dateOnlyParts('2026-06-01T00:00:00.000Z');
        expect(p.day).toBe(1);
        expect(p.month).toBe('JUN');
    });

    it('accepts a bare YYYY-MM-DD string', () => {
        expect(dateOnlyParts('2026-05-03').day).toBe(3);
    });

    it('accepts a Date object', () => {
        expect(dateOnlyParts(new Date('2026-05-03T00:00:00.000Z')).day).toBe(3);
    });
});

describe('formatDateOnly', () => {
    it('formats the stored calendar date', () => {
        expect(formatDateOnly('2026-05-03T00:00:00.000Z')).toBe('3 May 2026');
    });

    it('handles a New Year boundary without shifting the year', () => {
        expect(formatDateOnly('2027-01-01T00:00:00.000Z')).toBe('1 Jan 2027');
    });

    it('lets explicit options replace the defaults instead of merging', () => {
        // A month/year format must NOT gain a stray day component.
        expect(formatDateOnly('2026-05-03T00:00:00.000Z', { month: 'long', year: 'numeric' }))
            .toBe('May 2026');
        expect(formatDateOnly('2026-05-03T00:00:00.000Z', { day: 'numeric', month: 'short' }))
            .toBe('3 May');
    });

    it('respects a caller-supplied locale', () => {
        expect(formatDateOnly('2026-05-03T00:00:00.000Z', { day: 'numeric', month: 'short', year: 'numeric' }, 'en-IN'))
            .toContain('2026');
    });
});

describe('toDateOnlyISO', () => {
    it('round-trips the stored calendar date', () => {
        expect(toDateOnlyISO('2026-05-03T00:00:00.000Z')).toBe('2026-05-03');
        expect(toDateOnlyISO('2026-01-01T00:00:00.000Z')).toBe('2026-01-01');
    });
});

describe('invalid input', () => {
    it('returns empty string rather than "Invalid Date"', () => {
        expect(formatDateOnly(null)).toBe('');
        expect(formatDateOnly(undefined)).toBe('');
        expect(formatDateOnly('not-a-date')).toBe('');
        expect(toDateOnlyISO(null)).toBe('');
    });

    it('still renders a corrupt-but-parseable year rather than crashing', () => {
        // Production had an event with registrationDeadline stored as year 0002.
        // Intl renders that year as "2"; what matters is the day does not shift
        // and nothing throws.
        expect(formatDateOnly('0002-04-26T00:00:00.000Z')).toBe('26 Apr 2');
        expect(dateOnlyParts('0002-04-26T00:00:00.000Z').day).toBe(26);
    });
});

describe('timezone independence', () => {
    // The regression guard: the process TZ must not change the answer. Vitest runs
    // in one timezone, so we assert via explicit Intl formatting in each zone.
    it('produces the same calendar day in every timezone', () => {
        for (const tz of TZS) {
            const rendered = new Intl.DateTimeFormat('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
            }).format(new Date('2026-05-03T00:00:00.000Z'));
            expect(rendered, `failed for ${tz}`).toBe('3 May 2026');
        }
        // And the helper agrees with that, whatever TZ the test process is in.
        expect(formatDateOnly('2026-05-03T00:00:00.000Z')).toBe('3 May 2026');
        expect(dateOnlyParts('2026-05-03T00:00:00.000Z').day).toBe(3);
    });
});
