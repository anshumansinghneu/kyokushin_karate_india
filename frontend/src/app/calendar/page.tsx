'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, ArrowUpRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getEventStatus } from '@/lib/eventStatus';
import Section from '@/components/brand/Section';

import { dateOnlyParts, formatDateOnly } from '@/lib/dateOnly';
interface Event {
    id: string;
    type: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
    status: string;
    memberFee: number;
    nonMemberFee: number;
    registrationDeadline: string;
    dojo?: { name: string; city: string } | null;
}

/*
 * Event types are told apart by mark shape and brightness, not by new hues:
 * the palette stays black, white, red and gold. Gold is a tournament (where
 * rank is won); a solid white mark is a camp; a ring is a seminar; a square is
 * a grading.
 */
const TYPE_MARKS: Record<string, { mark: string; label: string }> = {
    TOURNAMENT: { mark: 'rounded-full bg-secondary', label: 'Tournament' },
    CAMP: { mark: 'rounded-full bg-white', label: 'Camp' },
    SEMINAR: { mark: 'rounded-full ring-[1.5px] ring-inset ring-white', label: 'Seminar' },
    BELT_EXAM: { mark: 'rounded-[1px] bg-white/70', label: 'Grading' },
};
const markFor = (type: string) => TYPE_MARKS[type] ?? { mark: 'rounded-full bg-white/50', label: type.charAt(0) + type.slice(1).toLowerCase() };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black';

export default function CalendarPage() {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    const loadEvents = () => {
        api.get('/events')
            .then(res => setEvents(res.data.data.events))
            .catch(err => {
                console.error('Failed to load events:', err);
                setError(true);
            })
            .finally(() => setLoading(false));
    };

    // Retry path: reset the visible state, then load again.
    const fetchEvents = () => {
        setLoading(true);
        setError(false);
        loadEvents();
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
        setSelectedDate(null);
    };

    const goToToday = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDate(null);
    };

    // Group events by date
    const eventsByDate = useMemo(() => {
        const map: Record<string, Event[]> = {};
        events.forEach(event => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            // Spread multi-day events across all days
            const d = new Date(start);
            while (d <= end) {
                const key = d.toISOString().slice(0, 10);
                if (!map[key]) map[key] = [];
                if (!map[key].find(e => e.id === event.id)) {
                    map[key].push(event);
                }
                d.setDate(d.getDate() + 1);
            }
        });
        return map;
    }, [events]);

    // Events for selected date
    const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

    // Upcoming events (for list view)
    const upcomingEvents = useMemo(() => {
        return events
            .filter(e => getEventStatus(e) !== 'COMPLETED')
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [events]);

    // Events in the visible month, for the side panel when no day is chosen.
    const monthEvents = useMemo(() => {
        const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const seen = new Map<string, Event>();
        Object.entries(eventsByDate).forEach(([key, list]) => {
            if (key.startsWith(prefix)) list.forEach(e => seen.set(e.id, e));
        });
        return [...seen.values()].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [eventsByDate, currentYear, currentMonth]);

    // Calendar grid
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = today.toISOString().slice(0, 10);

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [firstDay, daysInMonth]);

    const panelEvents = selectedDate ? selectedEvents : monthEvents;

    return (
        <div className="min-h-screen bg-black text-white">
            <Section rhythm="tight" width="wide" className="pt-6 md:pt-10">
                {/* Header */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-[clamp(2.75rem,7vw,5rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                            Calendar<span className="text-primary">.</span>
                        </h1>
                        <p className="mt-3 text-lg text-white/70">Tournaments, camps, seminars and gradings, month by month.</p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Legend */}
                        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70" aria-label="Event types">
                            {Object.entries(TYPE_MARKS).map(([type, t]) => (
                                <li key={type} className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 ${t.mark}`} aria-hidden="true" />
                                    {t.label}
                                </li>
                            ))}
                        </ul>
                        {/* View toggle */}
                        <div role="group" aria-label="View" className="flex self-start border border-white/20">
                            {(['calendar', 'list'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    aria-pressed={viewMode === mode}
                                    className={`min-h-11 px-4 text-sm font-bold capitalize transition-colors ${focusRing} ${viewMode === mode ? 'bg-white text-black' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {mode === 'calendar' ? 'Month' : 'List'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 md:mt-14">
                    {loading ? (
                        <div aria-busy="true" className="grid grid-cols-7 gap-px border border-white/10 bg-white/10">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <div key={i} className="aspect-square animate-pulse bg-black motion-reduce:animate-none" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="border-y border-white/10 py-16 text-center">
                            <p className="text-xl font-bold text-white">We couldn&apos;t load the calendar</p>
                            <p className="mt-2 text-white/70">Check your connection and try again.</p>
                            <button onClick={fetchEvents} className={`mt-6 inline-flex min-h-12 items-center gap-2 border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10 ${focusRing}`}>
                                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
                            </button>
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
                            {/* Month */}
                            <div>
                                <div className="mb-6 flex items-center justify-between gap-4">
                                    <h2 className="text-2xl font-extrabold md:text-3xl" aria-live="polite">
                                        {MONTHS[currentMonth]} <span className="text-white/50">{currentYear}</span>
                                    </h2>
                                    <div className="flex items-center gap-1">
                                        <button onClick={goToToday} className={`min-h-11 px-3 text-sm font-bold text-white/75 transition-colors hover:text-white ${focusRing}`}>
                                            Today
                                        </button>
                                        <button onClick={prevMonth} aria-label="Previous month" className={`flex h-11 w-11 items-center justify-center border border-white/20 transition-colors hover:bg-white/10 ${focusRing}`}>
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button onClick={nextMonth} aria-label="Next month" className={`flex h-11 w-11 items-center justify-center border border-white/20 transition-colors hover:bg-white/10 ${focusRing}`}>
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 border-b border-white/15 pb-2">
                                    {DAYS.map(day => (
                                        <div key={day} className="text-center text-xs font-semibold text-white/50 sm:text-sm">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid: hairlines, not tiles. */}
                                <div className="grid grid-cols-7">
                                    {calendarDays.map((day, i) => {
                                        if (day === null) {
                                            return <div key={`empty-${i}`} className="aspect-square border-b border-white/5" />;
                                        }
                                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const dayEvents = eventsByDate[dateStr] || [];
                                        const isToday = dateStr === todayStr;
                                        const isSelected = dateStr === selectedDate;

                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                                aria-pressed={isSelected}
                                                aria-label={`${day} ${MONTHS[currentMonth]}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
                                                className={`relative flex aspect-square flex-col items-start justify-between border-b border-white/5 p-1.5 text-left transition-colors sm:p-2.5 ${focusRing} ${
                                                    isSelected ? 'bg-white text-black' : dayEvents.length ? 'hover:bg-white/10' : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-7 w-7 items-center justify-center text-sm font-bold tabular-nums sm:text-base ${
                                                        isSelected ? 'text-black' : isToday ? 'rounded-full bg-primary text-white' : dayEvents.length ? 'text-white' : 'text-white/45'
                                                    }`}
                                                >
                                                    {day}
                                                </span>
                                                {dayEvents.length > 0 && (
                                                    <span className="flex flex-wrap gap-1" aria-hidden="true">
                                                        {dayEvents.slice(0, 3).map((event, j) => (
                                                            <span key={j} className={`h-1.5 w-1.5 sm:h-2 sm:w-2 ${isSelected ? 'rounded-full bg-black' : markFor(event.type).mark}`} />
                                                        ))}
                                                        {dayEvents.length > 3 && (
                                                            <span className="text-[10px] leading-none">+{dayEvents.length - 3}</span>
                                                        )}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Side panel: the chosen day, or everything this month. */}
                            <div className="border-t border-white/10 pt-8 lg:border-t-0 lg:pt-0">
                                <h3 className="text-xl font-extrabold">
                                    {selectedDate
                                        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                                        : `This month`
                                    }
                                </h3>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedDate ?? `${currentYear}-${currentMonth}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        {panelEvents.length > 0 ? (
                                            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                                                {panelEvents.map(event => {
                                                    const t = markFor(event.type);
                                                    return (
                                                        <li key={event.id}>
                                                            <Link href={`/events/${event.id}`} className={`group block py-5 ${focusRing}`}>
                                                                <p className="flex items-center gap-2 text-sm font-semibold text-white/60">
                                                                    <span className={`h-2 w-2 ${t.mark}`} aria-hidden="true" />
                                                                    {t.label}
                                                                    <span className="text-white/30" aria-hidden="true">·</span>
                                                                    {formatDateOnly(event.startDate, { day: 'numeric', month: 'short' }, 'en-IN')}
                                                                    {event.startDate !== event.endDate && `–${formatDateOnly(event.endDate, { day: 'numeric', month: 'short' }, 'en-IN')}`}
                                                                </p>
                                                                <h4 className="mt-1.5 flex items-start justify-between gap-3 font-bold leading-snug text-white transition-colors group-hover:text-primary-light">
                                                                    {event.name}
                                                                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                                                                </h4>
                                                                {event.location && (
                                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                                                                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {event.location}
                                                                    </p>
                                                                )}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="mt-4 text-white/60">
                                                {selectedDate ? 'Nothing on this day.' : 'Nothing scheduled this month. Choose a day, or look ahead a month.'}
                                            </p>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        /* List View */
                        upcomingEvents.length === 0 ? (
                            <div className="border-y border-white/10 py-16 text-center">
                                <p className="text-xl font-bold text-white">No upcoming events</p>
                                <p className="mt-2 text-white/60">The next dates are being set. Switch to the month view to see past events.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/10 border-y border-white/10">
                                {upcomingEvents.map(event => {
                                    const t = markFor(event.type);
                                    const startDate = new Date(event.startDate);
                                    const st = getEventStatus(event);
                                    return (
                                        <li key={event.id}>
                                            <Link href={`/events/${event.id}`} className={`group grid grid-cols-[4rem_1fr_auto] items-center gap-5 py-6 sm:grid-cols-[5rem_1fr_8rem_auto] sm:gap-8 ${focusRing}`}>
                                                <div className="text-center">
                                                    <div className="text-sm font-bold">{formatDateOnly(startDate, { month: 'short' }, 'en-IN')}</div>
                                                    <div className="text-4xl font-black leading-none tabular-nums">{dateOnlyParts(startDate).day}</div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="flex items-center gap-2 text-sm font-semibold text-white/60">
                                                        <span className={`h-2 w-2 ${t.mark}`} aria-hidden="true" />
                                                        {t.label}
                                                        {st === 'ONGOING' && <span className="text-primary-light">In progress</span>}
                                                    </p>
                                                    <h3 className="mt-1 truncate text-lg font-extrabold text-white transition-colors group-hover:text-primary-light">{event.name}</h3>
                                                    {event.location && (
                                                        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-white/60">
                                                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {event.location}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="hidden text-right sm:block">
                                                    <p className="text-lg font-bold text-white">{event.memberFee > 0 ? `₹${event.memberFee}` : 'Free'}</p>
                                                    <p className="text-xs text-white/50">members</p>
                                                </div>
                                                <ArrowUpRight className="h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    )}
                </div>
            </Section>
        </div>
    );
}
