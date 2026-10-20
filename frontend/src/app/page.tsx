"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Preloader from "@/components/home/film/Preloader";
import ChapterKarateka from "@/components/home/film/ChapterKarateka";
import ChapterKumite from "@/components/home/film/ChapterKumite";
import ChapterOsu from "@/components/home/film/ChapterOsu";
import ThreeWays from "@/components/home/film/ThreeWays";
import OyamaQuote from "@/components/home/film/OyamaQuote";
import ChapterEyes from "@/components/home/film/ChapterEyes";
import EventsArena, { type ArenaEvent } from "@/components/home/film/EventsArena";
import Lineage from "@/components/home/film/Lineage";
import TeamIndiaRow from "@/components/home/film/TeamIndiaRow";
import FloorVoices from "@/components/home/film/FloorVoices";
import Chronicles, { type ChroniclePost } from "@/components/home/film/Chronicles";
import OnTheMats from "@/components/home/film/OnTheMats";
import FinalCta from "@/components/home/film/FinalCta";

/*
 * The homepage as a scroll film (KKFI_REDESIGN.md): the dojo before dawn.
 * Three film chapters (the karateka, kumite, osu), then quiet sections around
 * one more film (head low, eyes high), ending on the white belt becoming black.
 */
export default function Home() {
    const [events, setEvents] = useState<ArenaEvent[]>([]);
    const [content, setContent] = useState<Record<string, { value?: string } | undefined>>({});
    const [posts, setPosts] = useState<ChroniclePost[]>([]);

    // Load progress of the first film, fanned out to the preloader without re-rendering the page per frame.
    const loadListeners = useRef(new Set<(f: number) => void>());
    const lastFraction = useRef(0);
    const onLoadProgress = useCallback((f: number) => {
        lastFraction.current = f;
        loadListeners.current.forEach((fn) => fn(f));
    }, []);
    const subscribeLoad = useCallback((fn: (f: number) => void) => {
        loadListeners.current.add(fn);
        fn(lastFraction.current);
        return () => {
            loadListeners.current.delete(fn);
        };
    }, []);

    useEffect(() => {
        (async () => {
            const [eventsRes, contentRes, blogsRes] = await Promise.allSettled([
                api.get("/events"),
                api.get("/content"),
                api.get("/posts?type=BLOG"),
            ]);
            if (eventsRes.status === "fulfilled") setEvents(eventsRes.value.data.data.events.slice(0, 5));
            else console.error("Failed to fetch events", eventsRes.reason);
            if (contentRes.status === "fulfilled") setContent(contentRes.value.data.data.content);
            else console.error("Failed to fetch content", contentRes.reason);
            if (blogsRes.status === "fulfilled") setPosts(blogsRes.value.data.data.posts.slice(0, 3));
            else console.error("Failed to fetch blogs", blogsRes.reason);
        })();
    }, []);

    return (
        <div className={`relative overflow-x-clip bg-night font-gothic text-canvas selection:bg-dan-gold selection:text-night`}>
            <Preloader subscribe={subscribeLoad} />

            <ChapterKarateka onLoadProgress={onLoadProgress} />
            <ChapterKumite />
            {/* The navbar turns solid once this chapter has scrolled past. */}
            <div data-nav-solid-after>
                <ChapterOsu />
            </div>

            <ThreeWays />
            <OyamaQuote src={content["mas_oyama_image"]?.value} />
            <ChapterEyes />
            <EventsArena events={events} />
            <Lineage />
            <TeamIndiaRow />
            <FloorVoices />
            <Chronicles posts={posts} />
            <OnTheMats />
            <FinalCta />
        </div>
    );
}
