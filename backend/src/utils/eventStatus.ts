// Single source of truth for an event's lifecycle state, derived from its dates.
//
// The stored Event.status column is set at creation ('UPCOMING') and never
// transitions as time passes, so it goes stale. Deriving from startDate/endDate
// keeps "has this event finished?" correct without a scheduled job.
//
// NOTE: this does NOT know about the CANCELLED state (that is an explicit,
// non-date decision). Callers must check `status === 'CANCELLED'` separately
// before trusting the derived value.
//
// This mirrors frontend/src/lib/eventStatus.ts — keep them in sync.

export type DerivedEventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

interface EventDates {
    startDate: Date | string;
    endDate?: Date | string | null;
}

export function getEventStatus(event: EventDates, now: Date = new Date()): DerivedEventStatus {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;

    // Inclusive of the whole final day (we only have date granularity).
    //
    // Uses setUTCHours, NOT setHours: these dates are date-only values stored as
    // UTC midnight. Using the local-time setter shifts the boundary by the
    // viewer's UTC offset, which flipped same-day events to COMPLETED early for
    // anyone west of UTC (and late for anyone east of it).
    const endOfEndDay = new Date(end);
    endOfEndDay.setUTCHours(23, 59, 59, 999);

    if (now < start) return 'UPCOMING';
    if (now <= endOfEndDay) return 'ONGOING';
    return 'COMPLETED';
}

// True once the event has fully ended (does not account for CANCELLED).
export const isEventFinished = (event: EventDates, now: Date = new Date()): boolean =>
    getEventStatus(event, now) === 'COMPLETED';

// The status to expose to clients: an explicit CANCELLED is always preserved,
// otherwise it is derived from the dates (so the stored value can never go stale).
export function resolveEventStatus(
    event: EventDates & { status?: string | null },
    now: Date = new Date()
): string {
    if (event.status === 'CANCELLED') return 'CANCELLED';
    return getEventStatus(event, now);
}
