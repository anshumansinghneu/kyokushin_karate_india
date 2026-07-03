import { describe, it, expect } from 'vitest';
import { getEventStatus, isPastEvent } from './eventStatus';

// Fixed "now" = 3 July 2026, midday UTC, so the tests are deterministic.
const now = new Date('2026-07-03T12:00:00Z');

describe('getEventStatus', () => {
    it('returns UPCOMING for an event that has not started', () => {
        expect(getEventStatus({ startDate: '2026-08-01' }, now)).toBe('UPCOMING');
    });

    it('returns COMPLETED for a past single-day event', () => {
        // The bug from the screenshot: May 3 / Jun 1 are before today.
        expect(getEventStatus({ startDate: '2026-05-03' }, now)).toBe('COMPLETED');
        expect(getEventStatus({ startDate: '2026-06-01' }, now)).toBe('COMPLETED');
    });

    it('treats a same-day event as ONGOING through the day', () => {
        expect(getEventStatus({ startDate: '2026-07-03' }, now)).toBe('ONGOING');
    });

    it('treats a multi-day event spanning now as ONGOING (not COMPLETED at start)', () => {
        expect(getEventStatus({ startDate: '2026-07-01', endDate: '2026-07-10' }, now)).toBe('ONGOING');
    });

    it('returns COMPLETED once a multi-day event has fully ended', () => {
        expect(getEventStatus({ startDate: '2026-06-20', endDate: '2026-06-25' }, now)).toBe('COMPLETED');
    });

    it('accepts Date objects as well as strings', () => {
        expect(getEventStatus({ startDate: new Date('2026-09-01') }, now)).toBe('UPCOMING');
    });
});

describe('isPastEvent', () => {
    it('is true only for COMPLETED events', () => {
        expect(isPastEvent({ startDate: '2026-05-03' }, now)).toBe(true);
        expect(isPastEvent({ startDate: '2026-08-01' }, now)).toBe(false);
        expect(isPastEvent({ startDate: '2026-07-03' }, now)).toBe(false); // ongoing today
    });
});
