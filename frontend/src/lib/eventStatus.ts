// Single source of truth for an event's lifecycle state.
//
// The backend `event.status` field is set once at creation ('UPCOMING') and never
// transitions when the date passes, so it goes stale. Deriving status from the
// event's dates keeps every surface (dashboard widget, events list, calendar,
// detail badge) consistent and correct without a backend cron.
//
// An event counts as ONGOING through the END of its final day (or its start day
// for single-day events), since we only have date granularity — this also stops
// multi-day events from flipping to COMPLETED the moment they start.

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface EventLike {
    startDate: string | Date;
    endDate?: string | Date | null;
}

export function getEventStatus(event: EventLike, now: Date = new Date()): EventStatus {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;

    // Inclusive of the whole final day.
    const endOfEndDay = new Date(end);
    endOfEndDay.setHours(23, 59, 59, 999);

    if (now < start) return 'UPCOMING';
    if (now <= endOfEndDay) return 'ONGOING';
    return 'COMPLETED';
}

// Convenience: an event is "past" only once it is fully COMPLETED.
export const isPastEvent = (event: EventLike, now: Date = new Date()): boolean =>
    getEventStatus(event, now) === 'COMPLETED';
