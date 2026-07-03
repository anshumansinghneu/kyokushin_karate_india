import { describe, it, expect } from 'vitest';
import { getEventStatus, isEventFinished, resolveEventStatus } from './eventStatus';

const now = new Date('2026-07-03T12:00:00Z'); // 3 July 2026, midday UTC

describe('getEventStatus', () => {
    it('UPCOMING before the start date', () => {
        expect(getEventStatus({ startDate: '2026-08-01' }, now)).toBe('UPCOMING');
    });

    it('COMPLETED for a past single-day event', () => {
        expect(getEventStatus({ startDate: '2026-05-03' }, now)).toBe('COMPLETED');
    });

    it('ONGOING for a same-day event, through the whole day', () => {
        expect(getEventStatus({ startDate: '2026-07-03' }, now)).toBe('ONGOING');
    });

    it('ONGOING for a multi-day event that spans now', () => {
        expect(getEventStatus({ startDate: '2026-07-01', endDate: '2026-07-10' }, now)).toBe('ONGOING');
    });

    it('COMPLETED once a multi-day event has fully ended', () => {
        expect(getEventStatus({ startDate: '2026-06-20', endDate: '2026-06-25' }, now)).toBe('COMPLETED');
    });

    it('accepts Date objects', () => {
        expect(getEventStatus({ startDate: new Date('2026-06-20'), endDate: new Date('2026-06-25') }, now)).toBe('COMPLETED');
    });
});

describe('isEventFinished', () => {
    it('is true only when the event has fully ended', () => {
        expect(isEventFinished({ startDate: '2026-05-03' }, now)).toBe(true);
        expect(isEventFinished({ startDate: '2026-07-03' }, now)).toBe(false);
        expect(isEventFinished({ startDate: '2026-08-01' }, now)).toBe(false);
    });
});

describe('resolveEventStatus', () => {
    it('derives from dates when not cancelled (fixes stale stored status)', () => {
        // The exact production bug: stored UPCOMING, but the date is a month past.
        expect(resolveEventStatus({ status: 'UPCOMING', startDate: '2026-06-01' }, now)).toBe('COMPLETED');
    });

    it('always preserves an explicit CANCELLED regardless of dates', () => {
        expect(resolveEventStatus({ status: 'CANCELLED', startDate: '2026-05-03' }, now)).toBe('CANCELLED');
        expect(resolveEventStatus({ status: 'CANCELLED', startDate: '2026-08-01' }, now)).toBe('CANCELLED');
    });

    it('reports a genuinely future event as UPCOMING', () => {
        expect(resolveEventStatus({ status: 'UPCOMING', startDate: '2026-08-01' }, now)).toBe('UPCOMING');
    });
});
