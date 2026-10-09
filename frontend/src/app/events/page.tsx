"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useScroll } from "framer-motion";
import { MapPin, ArrowRight, ArrowUpRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getEventStatus, type EventStatus } from "@/lib/eventStatus";
import SceneSlot from "@/components/three/SceneSlot";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import BrandLink from "@/components/brand/BrandLink";
import type { Ticket } from "@/components/three/scenes/TicketsScene";

import { dateOnlyParts, formatDateOnlyRange } from '@/lib/dateOnly';

interface KkfiEvent {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
    memberFee?: number;
}

type Filter = "ALL" | "TOURNAMENT" | "CAMP" | "SEMINAR" | "BELT_EXAM";

const FILTERS: { value: Filter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "TOURNAMENT", label: "Tournaments" },
    { value: "CAMP", label: "Camps" },
    { value: "SEMINAR", label: "Seminars" },
    { value: "BELT_EXAM", label: "Gradings" },
];

const typeLabel = (type: string) =>
    type === "BELT_EXAM" ? "Grading" : type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");

/* ------------------------------------------------------------------ */
/*  The next event's countdown, set in ink                             */
/* ------------------------------------------------------------------ */

function useCountdown(target: string | null) {
    const [left, setLeft] = useState<{ d: number; h: number; m: number } | null>(null);
    useEffect(() => {
        if (!target) return;
        const end = new Date(target).getTime();
        const tick = () => {
            const diff = Math.max(0, end - Date.now());
            setLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000) });
        };
        const first = requestAnimationFrame(tick);
        const id = setInterval(tick, 30000);
        return () => {
            cancelAnimationFrame(first);
            clearInterval(id);
        };
    }, [target]);
    return target ? left : null;
}

/** Numerals with a faint ink bleed at the edges: an SVG displacement, static and cheap. */
function InkNumeral({ value, label }: { value: number; label: string }) {
    return (
        <div>
            <div className="text-[clamp(3rem,8vw,5.5rem)] font-black leading-none tracking-[-0.04em] text-white tabular-nums [filter:url(#ink-bleed)]">
                {String(value).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-semibold text-white/60">{label}</div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  One row of the calendar                                            */
/* ------------------------------------------------------------------ */

function EventRow({ event, status }: { event: KkfiEvent; status: EventStatus }) {
    const d = dateOnlyParts(event.startDate);
    const past = status === "COMPLETED";
    return (
        <li>
            <Link
                href={`/events/${event.id}`}
                className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-5 gap-y-1 py-6 transition-colors sm:grid-cols-[6rem_1fr_9rem_auto] sm:gap-x-8"
            >
                <div className={`text-center ${past ? "text-white/45" : "text-white"}`}>
                    <div className="text-sm font-bold">{d.month}</div>
                    <div className="text-4xl font-black leading-none tabular-nums sm:text-5xl">{d.day}</div>
                    <div className="mt-1 text-xs font-semibold text-white/50">{d.year}</div>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/60">
                        {typeLabel(event.type)}
                        {status === "ONGOING" && <span className="ml-2 text-primary-light">In progress</span>}
                    </p>
                    <h3 className={`mt-1 text-pretty text-lg font-extrabold leading-snug transition-colors group-hover:text-primary-light sm:text-xl ${past ? "text-white/70" : "text-white"}`}>
                        {event.name}
                    </h3>
                    {event.location && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/60">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{event.location}</span>
                        </p>
                    )}
                </div>
                <div className="hidden text-right sm:block">
                    {!past && event.memberFee !== undefined && (
                        <>
                            <div className="text-lg font-bold text-white">{event.memberFee > 0 ? `₹${event.memberFee}` : "Free"}</div>
                            <div className="text-xs text-white/50">members</div>
                        </>
                    )}
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
            </Link>
        </li>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero: the tickets                                                   */
/* ------------------------------------------------------------------ */

function TicketsHero({
    tickets,
    next,
    isLoading,
    hasEvents,
}: {
    tickets: Ticket[];
    next: KkfiEvent | null;
    isLoading: boolean;
    hasEvents: boolean;
}) {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const sceneProps = useMemo(() => ({ tickets, progress: scrollYProgress }), [tickets, scrollYProgress]);
    const left = useCountdown(next ? next.startDate : null);

    return (
        <header ref={ref} data-bleed className="relative flex min-h-[100svh] overflow-hidden">
            <SceneSlot
                scene="tickets"
                sceneProps={sceneProps}
                className="absolute inset-x-0 top-0 h-[54svh] md:inset-0 md:h-auto"
                // Same rule as the scene: nothing upcoming means the undated ticket is on top.
                fallback={<TicketsPoster ticket={tickets[0]?.status !== "COMPLETED" ? tickets[0] : undefined} />}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_42%,transparent_60%)] md:bg-gradient-to-r md:from-black/85 md:via-black/30 md:via-45% md:to-transparent" />
            {/* Settle the ink into the black of the list below. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-48 bg-gradient-to-t from-black to-transparent md:block" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-24 pt-[52svh] sm:px-6 md:justify-center md:pb-16 md:pt-40 lg:px-8">
                <h1 className="text-[clamp(3rem,9vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.035em] text-white">
                    Events<span className="text-primary">.</span>
                </h1>

                {isLoading ? (
                    <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-white/70 md:text-xl">Loading the calendar…</p>
                ) : next ? (
                    <div className="mt-8 max-w-xl">
                        <p className="text-sm font-semibold text-white/60">Next: {typeLabel(next.type)}</p>
                        <Link href={`/events/${next.id}`} className="mt-2 block text-pretty text-2xl font-extrabold leading-tight text-white transition-colors hover:text-primary-light md:text-3xl">
                            {next.name}
                        </Link>
                        <p className="mt-2 text-white/70">
                            {formatDateOnlyRange(next.startDate, next.endDate)}
                            {next.location ? ` · ${next.location}` : ""}
                        </p>
                        {left && getEventStatus(next) === "UPCOMING" && (
                            <div role="timer" aria-label="Time until the next event" className="mt-8 flex gap-8 sm:gap-12">
                                <InkNumeral value={left.d} label="days" />
                                <InkNumeral value={left.h} label="hours" />
                                <InkNumeral value={left.m} label="minutes" />
                            </div>
                        )}
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <BrandLink href={`/events/${next.id}`}>
                                Register <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </BrandLink>
                            <BrandLink href="/calendar" variant="outline">Full calendar</BrandLink>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="mt-6 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                            Tournaments, camps, seminars and gradings across India.
                            {hasEvents && " The next dates are being set; until then, here is where we have been."}
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <BrandLink href="#calendar">See every event</BrandLink>
                            <BrandLink href="/calendar" variant="outline">Month view</BrandLink>
                        </div>
                    </>
                )}
            </div>

            {/* Ink bleed for the countdown numerals. */}
            <svg aria-hidden="true" className="absolute h-0 w-0">
                <filter id="ink-bleed" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
                    <feDisplacementMap in="SourceGraphic" scale="2.2" />
                </filter>
            </svg>
        </header>
    );
}

/** Still composition for reduced motion and slow devices: one ticket, squared up. */
function TicketsPoster({ ticket }: { ticket?: Ticket }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black md:justify-end md:pr-[8vw]">
            <div className="relative flex aspect-[2.3/1] w-[min(78vw,34rem)] -rotate-6 rounded-lg border border-white/20 bg-[#0c0c0c] text-white">
                <div className="flex flex-1 flex-col justify-between border-r border-dashed border-white/30 p-[5%]">
                    <p className="text-[clamp(0.6rem,1.4vw,0.8rem)] font-bold text-primary-light">
                        {ticket ? `${ticket.type.toUpperCase()} · ${ticket.status === "ONGOING" ? "IN PROGRESS" : "ADMIT ONE"}` : "KKFI · TO BE ANNOUNCED"}
                    </p>
                    <p className="line-clamp-3 text-[clamp(0.9rem,2.4vw,1.6rem)] font-black uppercase leading-tight">
                        {ticket?.title ?? "Next dates being set"}
                    </p>
                    <p className="truncate text-[clamp(0.6rem,1.3vw,0.8rem)] font-semibold text-white/60">{ticket?.location ?? "Camps · Seminars · Gradings"}</p>
                </div>
                <div className="flex w-[27%] flex-col items-center justify-center">
                    {ticket && ticket.day > 0 ? (
                        <>
                            <span className="text-[clamp(0.6rem,1.3vw,0.8rem)] font-bold">{ticket.month}</span>
                            <span className="text-[clamp(1.75rem,5vw,3.5rem)] font-black leading-none">{ticket.day}</span>
                            <span className="text-[clamp(0.6rem,1.3vw,0.8rem)] font-bold text-white/60">{ticket.year}</span>
                        </>
                    ) : (
                        <span className="flex aspect-[9/10] w-[62%] items-center justify-center border border-dashed border-white/35 text-[clamp(0.8rem,2vw,1.25rem)] font-extrabold">TBA</span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function EventsPage() {
    const [events, setEvents] = useState<KkfiEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>("ALL");

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/events');
            setEvents(response.data.data.events);
        } catch (err) {
            console.error("Failed to fetch events", err);
            setError("Failed to load events. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const now = new Date();
    const filteredEvents = events.filter(event => filter === "ALL" || event.type === filter);
    const upcomingEvents = filteredEvents
        .filter(e => getEventStatus(e, now) !== 'COMPLETED')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const pastEvents = filteredEvents
        .filter(e => getEventStatus(e, now) === 'COMPLETED')
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // The hero ignores the filter: soonest upcoming first, then the most recent past.
    const { tickets, next } = useMemo(() => {
        const at = new Date();
        const coming = events
            .filter((e) => getEventStatus(e, at) !== "COMPLETED")
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const done = events
            .filter((e) => getEventStatus(e, at) === "COMPLETED")
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        const toTicket = (e: KkfiEvent): Ticket => {
            const d = dateOnlyParts(e.startDate);
            return {
                id: e.id,
                title: e.name,
                type: typeLabel(e.type),
                dates: formatDateOnlyRange(e.startDate, e.endDate),
                day: d.day,
                month: d.month,
                year: d.year,
                location: e.location ?? "",
                status: getEventStatus(e, at),
            };
        };
        return { tickets: [...coming, ...done].slice(0, 6).map(toTicket), next: coming[0] ?? null };
    }, [events]);

    return (
        // Transparent so the tickets scene shows through from the canvas behind <main>.
        <div className="min-h-screen w-full text-white">
            <TicketsHero tickets={tickets} next={next} isLoading={isLoading} hasEvents={events.length > 0} />

            <Section id="calendar" rhythm="base" width="base" className="scroll-mt-24 bg-black">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <Heading>{upcomingEvents.length > 0 ? "What's coming" : "Every event"}</Heading>
                    <div role="group" aria-label="Filter by type" className="-mx-1 flex overflow-x-auto scrollbar-hide">
                        {FILTERS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(value)}
                                aria-pressed={filter === value}
                                className={`mx-1 min-h-11 shrink-0 border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                    filter === value
                                        ? "border-white bg-white text-black"
                                        : "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <ul aria-busy="true" className="mt-10 divide-y divide-white/10 border-y border-white/10">
                        {[0, 1, 2].map((i) => (
                            <li key={i} className="flex items-center gap-8 py-6">
                                <div className="h-16 w-16 animate-pulse rounded bg-white/5 motion-reduce:animate-none" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-3 w-24 animate-pulse rounded bg-white/5 motion-reduce:animate-none" />
                                    <div className="h-5 w-2/3 animate-pulse rounded bg-white/5 motion-reduce:animate-none" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : error ? (
                    <div className="mt-10 border-y border-white/10 py-16 text-center">
                        <h3 className="text-xl font-bold text-white">We couldn&apos;t load the calendar</h3>
                        <p className="mx-auto mt-2 max-w-md text-white/70">{error}</p>
                        <button
                            onClick={fetchEvents}
                            className="mt-6 inline-flex min-h-12 items-center gap-2 border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
                        </button>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="mt-10 border-y border-white/10 py-16 text-center">
                        <h3 className="text-xl font-bold text-white">Nothing here yet</h3>
                        <p className="mt-2 text-white/70">
                            There are no {filter !== "ALL" ? FILTERS.find((f) => f.value === filter)?.label.toLowerCase() : "events"} on the calendar right now.
                        </p>
                        {filter !== "ALL" && (
                            <button onClick={() => setFilter("ALL")} className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-white transition-colors hover:text-primary-light">
                                Show all events <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-10 space-y-16">
                        {upcomingEvents.length > 0 && (
                            <Reveal>
                                <ul className="divide-y divide-white/10 border-y border-white/10">
                                    {upcomingEvents.map((event) => (
                                        <EventRow key={event.id} event={event} status={getEventStatus(event, now)} />
                                    ))}
                                </ul>
                            </Reveal>
                        )}

                        {/* Nothing scheduled: say so, rather than dropping the
                            visitor straight into past events with no context. */}
                        {upcomingEvents.length === 0 && pastEvents.length > 0 && (
                            <p className="max-w-[56ch] text-lg leading-relaxed text-white/70">
                                No upcoming events right now. The next camp, seminar and grading dates are being
                                finalised; check back soon.
                            </p>
                        )}

                        {pastEvents.length > 0 && (
                            <Reveal>
                                <h3 className="text-xl font-bold text-white/70">Past events</h3>
                                <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                                    {pastEvents.map((event) => (
                                        <EventRow key={event.id} event={event} status="COMPLETED" />
                                    ))}
                                </ul>
                            </Reveal>
                        )}
                    </div>
                )}
            </Section>
        </div>
    );
}
