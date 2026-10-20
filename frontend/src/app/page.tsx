"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Exhibit from "@/components/home/film/Exhibit";
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
 * The homepage: the exhibit (one karateka on a stage, four acts), then the
 * scroll films (the karateka, kumite, osu), quiet sections around one more film
 * (head low, eyes high), ending on the white belt becoming black.
 */
export default function Home() {
    const [events, setEvents] = useState<ArenaEvent[]>([]);
    const [content, setContent] = useState<Record<string, { value?: string } | undefined>>({});
    const [posts, setPosts] = useState<ChroniclePost[]>([]);

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
            <Exhibit />
            <ChapterKarateka />
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
