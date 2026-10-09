"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLink from "@/components/brand/BrandLink";
import Reveal from "@/components/brand/Reveal";
import { useTilt } from "@/hooks/useTilt";
import { getEventStatus } from "@/lib/eventStatus";
import { dateOnlyParts, formatDateOnly } from "@/lib/dateOnly";

export interface SpotlightEvent {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
}

const typeLabel = (type: string) =>
    type === "BELT_EXAM" ? "Grading" : type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");

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

/** A printed admission ticket: paper-white stock, perforated stub, a red stamp only when it is coming up. */
function Ticket({ event }: { event: SpotlightEvent | null }) {
    const { ref, handlers, style } = useTilt(8);
    const d = event ? dateOnlyParts(event.startDate) : null;
    return (
        <motion.div
            ref={ref as React.Ref<HTMLDivElement>}
            {...handlers}
            style={style}
            className="relative mx-auto grid w-full max-w-[34rem] grid-cols-[1fr_auto] overflow-hidden rounded-md bg-[#f2f0ec] text-black"
        >
            <div className="p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-black/55">
                    KKFI · {event ? typeLabel(event.type) : "To be announced"}
                </p>
                <p className="mt-4 text-balance text-2xl font-black uppercase leading-[1.05] tracking-[-0.01em] sm:text-3xl">
                    {event ? event.name : "Next dates being set"}
                </p>
                <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-black/65">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {event?.location || "Venue to be announced"}
                </p>
            </div>
            {/* Stub, separated by a perforation. */}
            <div className="relative flex w-28 flex-col items-center justify-center border-l-2 border-dashed border-black/25 px-4 text-center sm:w-32">
                <span aria-hidden="true" className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-black" />
                <span aria-hidden="true" className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-black" />
                {d ? (
                    <>
                        <span className="text-sm font-bold uppercase">{d.month}</span>
                        <span className="text-5xl font-black leading-none tabular-nums">{d.day}</span>
                        <span className="mt-1 text-xs font-semibold text-black/55">{d.year}</span>
                    </>
                ) : (
                    <span className="text-3xl font-black">TBA</span>
                )}
            </div>
            {event && (
                <span aria-hidden="true" className="absolute right-[7.5rem] top-5 -rotate-12 border-2 border-primary px-2 py-0.5 text-xs font-black uppercase tracking-[0.1em] text-primary sm:right-36">
                    Admit one
                </span>
            )}
        </motion.div>
    );
}

/**
 * The event moment on the homepage. With an upcoming event: the ticket, an
 * ink countdown and a register link. Without one: an honest "dates being set"
 * ticket, the last event we held, and the calendar.
 */
export default function EventSpotlight({ events }: { events: SpotlightEvent[] }) {
    const upcoming = events
        .filter((e) => getEventStatus(e) !== "COMPLETED")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
    const last = events
        .filter((e) => getEventStatus(e) === "COMPLETED")
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
    const left = useCountdown(upcoming?.startDate ?? null);

    return (
        <section className="relative overflow-hidden bg-black px-4 py-[clamp(4rem,9vw,8rem)] sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
                <Reveal kind="depth" className="order-2 lg:order-1">
                    <div style={{ perspective: 1000 }}>
                        <Ticket event={upcoming} />
                    </div>
                </Reveal>

                <Reveal className="order-1 lg:order-2">
                    <p className="text-sm font-semibold text-primary-light">{upcoming ? "Next on the calendar" : "The calendar"}</p>
                    {upcoming ? (
                        <>
                            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">
                                {upcoming.name}
                            </h2>
                            {left && (
                                <div role="timer" aria-label="Time until the event starts" className="mt-8 flex gap-8">
                                    {[
                                        { v: left.d, l: "days" },
                                        { v: left.h, l: "hours" },
                                        { v: left.m, l: "minutes" },
                                    ].map(({ v, l }) => (
                                        <div key={l}>
                                            <div className="text-[clamp(3rem,8vw,5.5rem)] font-black leading-none tracking-[-0.04em] text-white tabular-nums [filter:url(#home-ink-bleed)]">
                                                {String(v).padStart(2, "0")}
                                            </div>
                                            <div className="mt-2 text-sm font-semibold text-white/60">{l}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                <BrandLink href={`/events/${upcoming.id}`}>
                                    Register <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </BrandLink>
                                <BrandLink href="/events" variant="outline">All events</BrandLink>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="mt-4 max-w-[16ch] text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">
                                The next dates are being set<span className="text-primary">.</span>
                            </h2>
                            <p className="mt-6 max-w-[46ch] text-pretty text-lg leading-relaxed text-white/75">
                                Tournaments, camps, seminars and gradings are announced here first.
                                {last && (
                                    <>
                                        {" "}Most recently: <span className="font-semibold text-white">{last.name}</span>,{" "}
                                        {formatDateOnly(last.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}.
                                    </>
                                )}
                            </p>
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                <BrandLink href="/calendar">Open the calendar</BrandLink>
                                <BrandLink href="/events" variant="outline">Past events</BrandLink>
                            </div>
                        </>
                    )}
                </Reveal>
            </div>
            <svg aria-hidden="true" className="absolute h-0 w-0">
                <filter id="home-ink-bleed" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
                    <feDisplacementMap in="SourceGraphic" scale="2.2" />
                </filter>
            </svg>
        </section>
    );
}
