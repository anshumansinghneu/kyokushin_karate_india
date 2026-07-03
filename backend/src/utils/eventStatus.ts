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
    const endOfEndDay = new Date(end);
    endOfEndDay.setHours(23, 59, 59, 999);

    if (now < start) return 'UPCOMING';
    if (now <= endOfEndDay) return 'ONGOING';
    return 'COMPLETED';
}

// True once the event has fully ended (does not account for CANCELLED).
export const isEventFinished = (event: EventDates, now: Date = new Date()): boolean =>
    getEventStatus(event, now) === 'COMPLETED';
