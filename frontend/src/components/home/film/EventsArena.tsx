"use client";

import { useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/media";
import { getEventStatus } from "@/lib/eventStatus";
import { formatDateOnly } from "@/lib/dateOnly";
import FilmLink from "./FilmLink";
import { useReduced } from "./hooks";
import { body, h2, wrap } from "./ui";

export interface ArenaEvent {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
}

/**
 * The empty mat waiting for the next event: the arena loop behind a scrim,
 * with the next date (or an honest "being set") on top. The loop plays only
 * while on screen and stays paused under reduced motion.
 */
export default function EventsArena({ events }: { events: ArenaEvent[] }) {
    const video = useRef<HTMLVideoElement>(null);
    const reduced = useReduced();

    const upcoming = events
        .filter((e) => getEventStatus(e) !== "COMPLETED")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
    const last = events
        .filter((e) => getEventStatus(e) === "COMPLETED")
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;

    useEffect(() => {
        const v = video.current;
        if (!v) return;
        if (reduced) {
            v.pause();
            return;
        }
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) v.play().catch(() => {});
            else v.pause();
        });
        io.observe(v);
        return () => io.disconnect();
    }, [reduced]);

    return (
        <section aria-labelledby="events-heading" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-night px-4 py-[clamp(5rem,11vw,9rem)] md:px-10">
            <video
                ref={video}
                src={mediaUrl("loops/arena.mp4")}
                muted
                loop
                playsInline
                preload="none"
                aria-hidden="true"
                className="absolute inset-0 -z-20 h-full w-full object-cover"
            />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_90%,rgba(0,0,0,0.9),rgba(0,0,0,0.55)_50%,rgba(0,0,0,0.25)_80%)]" />

            <div className={wrap}>
                {upcoming ? (
                    <>
                        <h2 id="events-heading" className={`${h2} max-w-[20ch]`}>{upcoming.name}</h2>
                        <p className={`${body} mt-6 text-canvas`}>
                            Next on the calendar:{" "}
                            {formatDateOnly(upcoming.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}
                            {upcoming.location ? `, ${upcoming.location}` : ""}
                        </p>
                        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                            <FilmLink href={`/events/${upcoming.id}`}>Register</FilmLink>
                            <FilmLink href="/events" variant="quiet">All events</FilmLink>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 id="events-heading" className={`${h2} max-w-[16ch]`}>The next dates are being set.</h2>
                        <p className={`${body} mt-6 text-canvas`}>
                            Tournaments, camps, seminars and gradings are announced here first.
                            {last && (
                                <>
                                    {" "}Most recently: {last.name},{" "}
                                    {formatDateOnly(last.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}.
                                </>
                            )}
                        </p>
                        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                            <FilmLink href="/calendar">Open the calendar</FilmLink>
                            <FilmLink href="/events" variant="quiet">Past events</FilmLink>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
