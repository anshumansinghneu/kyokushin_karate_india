"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { ArrowRight, ArrowUpRight, MapPin, Calendar, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getEventStatus } from "@/lib/eventStatus";
import HeroSectionV2 from "@/components/HeroSectionV2";
import LeadershipSection from "@/components/LeadershipSection";
import MonthlyChampions from "@/components/MonthlyChampions";
import TestimonialsSection from "@/components/TestimonialsSection";
import TeamIndiaStrip from "@/components/TeamIndiaStrip";
import KankuMark from "@/components/KankuMark";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import BrandLink from "@/components/brand/BrandLink";
import { useTilt } from "@/hooks/useTilt";

import { formatDateOnly } from '@/lib/dateOnly';
interface Event {
  id: string;
  name: string;
  type: string;
  startDate: string;
  location: string;
}

interface Post {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt: string;
  externalLink?: string;
  sourceName?: string;
}

/* Counts up once, the first time it scrolls into view. */
function Count({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!inView || target === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 1600);
      setValue(Math.round(target * (1 - Math.pow(2, -10 * t))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return <span ref={ref} className="tabular-nums">{value.toLocaleString("en-IN")}</span>;
}

/* The founder's portrait: tilts toward the pointer, colour stays out of it. */
function FounderPortrait({ src }: { src: string }) {
  const { ref: tiltRef, handlers: tiltHandlers, style: tiltStyle } = useTilt(6);
  return (
    <Reveal kind="depth">
      <motion.figure
        ref={tiltRef as React.Ref<HTMLElement>}
        {...tiltHandlers}
        style={tiltStyle}
        className="relative overflow-hidden rounded-xl bg-surface"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Sosai Masutatsu Oyama in his gi, seated, facing the camera" className="aspect-[4/5] w-full object-cover object-top grayscale" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-16 text-sm font-semibold text-white/85">
          Sosai Masutatsu Oyama, 1923–1994
        </figcaption>
      </motion.figure>
    </Reveal>
  );
}

/* Countdown to the next upcoming event. */
function NextEventCountdown({ event }: { event: Event }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(event.startDate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event.startDate]);

  const blocks = [
    { value: timeLeft.days, label: "days" },
    { value: timeLeft.hours, label: "hours" },
    { value: timeLeft.minutes, label: "min" },
    { value: timeLeft.seconds, label: "sec" },
  ];

  return (
    <Section rhythm="base" width="wide" className="border-y border-white/10">
      <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
        <Reveal>
          <p className="mb-4 text-sm font-semibold text-primary-light">Next on the calendar</p>
          <Heading size="headline" className="max-w-[18ch]">{event.name}</Heading>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/70">
            <MapPin className="h-4 w-4" aria-hidden="true" /> {event.location || "Location to be announced"}
            <span aria-hidden="true" className="text-white/30">/</span>
            {formatDateOnly(event.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}
          </p>
          <div className="mt-8">
            <BrandLink href={`/events/${event.id}`}>
              Register <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </BrandLink>
          </div>
        </Reveal>

        <Reveal kind="depth" delay={0.1}>
          <div role="timer" aria-label="Time until the event starts" className="flex items-baseline gap-5 sm:gap-8">
            {blocks.map(({ value, label }, i) => (
              <div key={label} className="flex items-baseline gap-5 sm:gap-8">
                <div className="text-center">
                  <div className="text-[clamp(2.75rem,7vw,5.5rem)] font-black leading-none tracking-[-0.03em] text-white tabular-nums">
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white/60">{label}</div>
                </div>
                {i < blocks.length - 1 && <span aria-hidden="true" className="text-[clamp(2rem,5vw,4rem)] font-black leading-none text-white/20">:</span>}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);

  // Check splash after mount (sessionStorage is client-only) to avoid a hydration mismatch.
  useEffect(() => {
    if (sessionStorage.getItem('splash_seen')) return;
    const id = requestAnimationFrame(() => setShowSplash(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<Post[]>([]);
  const [mediaMentions, setMediaMentions] = useState<Post[]>([]);
  const [content, setContent] = useState<Record<string, { value?: string } | undefined>>({});
  const [newEventFlash, setNewEventFlash] = useState<Event | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [siteStats, setSiteStats] = useState({ dojos: 0, members: 0, events: 0, blackBelts: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const results = await Promise.allSettled([
        api.get('/events'),
        api.get('/content'),
        api.get('/posts?type=BLOG'),
        api.get('/posts?type=MEDIA_MENTION'),
        api.get('/analytics/public-stats')
      ]);

      const [eventsRes, contentRes, blogsRes, mediaRes, statsRes] = results;

      if (eventsRes.status === 'fulfilled') {
        const events = eventsRes.value.data.data.events.slice(0, 5);
        setFeaturedEvents(events);
        // Show flash notification for the newest event (only once per session)
        if (events.length > 0 && !sessionStorage.getItem('event_flash_shown')) {
          setNewEventFlash(events[0]);
          sessionStorage.setItem('event_flash_shown', 'true');
          setTimeout(() => setNewEventFlash(null), 5000);
        }
      } else {
        console.error("Failed to fetch events", eventsRes.reason);
      }

      if (contentRes.status === 'fulfilled') {
        setContent(contentRes.value.data.data.content);
      } else {
        console.error("Failed to fetch content", contentRes.reason);
      }

      if (blogsRes.status === 'fulfilled') {
        setLatestBlogs(blogsRes.value.data.data.posts.slice(0, 3));
      } else {
        console.error("Failed to fetch blogs", blogsRes.reason);
      }

      if (mediaRes.status === 'fulfilled') {
        setMediaMentions(mediaRes.value.data.data.posts.slice(0, 3));
      } else {
        console.error("Failed to fetch media mentions", mediaRes.reason);
      }

      if (statsRes.status === 'fulfilled') {
        setSiteStats(statsRes.value.data.data);
      }

      setDataLoaded(true);
    };
    fetchData();
  }, []);

  const [leadPost, ...morePosts] = latestBlogs;

  return (
    // Transparent on purpose: the hero's WebGL scene shows through from the canvas behind <main>.
    <div className="min-h-screen text-white selection:bg-primary selection:text-white overflow-x-clip relative">
      {/* Content renders immediately (and server-side); the splash, when shown, sits over it. */}
      {(
        <div aria-hidden={showSplash || undefined}>
          <HeroSectionV2 content={content} />

          {/* PHILOSOPHY: the founder, and his words set large beside him. */}
          <Section rhythm="open" width="wide" className="bg-black">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
              <FounderPortrait src={content['mas_oyama_image']?.value || "/oyama.png"} />
              <div>
                <Reveal kind="mask" duration={1.2}>
                  <blockquote>
                    <p className="max-w-[18ch] text-balance text-[clamp(2.25rem,5vw,4.5rem)] font-black leading-[1] tracking-[-0.03em] text-white">
                      The heart of our karate is real fighting<span className="text-primary">.</span>
                    </p>
                  </blockquote>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-8 max-w-[52ch] text-pretty text-lg leading-relaxed text-white/75 md:text-xl">
                    There can be no proof without real fighting. Without proof there is no trust. Without
                    trust there is no respect. This is a definition in the world of martial arts.
                  </p>
                  <p className="mt-6 font-semibold text-white">Sosai Masutatsu Oyama, founder of Kyokushin</p>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="mt-14 border-t border-white/10 pt-8 text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold uppercase leading-tight text-white/90">
                    Keep your head low, eyes high<span className="text-primary">.</span>
                  </p>
                </Reveal>
              </div>
            </div>
          </Section>

          <LeadershipSection />

          {/* THE FOUNDATION IN NUMBERS: one sentence, not a dashboard. */}
          {(siteStats.dojos > 0 || siteStats.members > 0) && (
            <Section rhythm="base" width="wide" className="bg-black">
              <Reveal kind="focus">
                <p className="max-w-[28ch] text-balance text-[clamp(1.75rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-white/45">
                  <span className="text-white"><Count target={siteStats.members} />+ members</span> training in{" "}
                  <span className="text-white"><Count target={siteStats.dojos} /> dojos</span>, tested across{" "}
                  <span className="text-white"><Count target={siteStats.events} /> events</span>, with{" "}
                  <span className="text-secondary"><Count target={siteStats.blackBelts} /> black belts</span> earned.
                </p>
              </Reveal>
            </Section>
          )}

          {featuredEvents.length > 0 && getEventStatus(featuredEvents[0]) === 'UPCOMING' && (
            <NextEventCountdown event={featuredEvents[0]} />
          )}

          <MonthlyChampions />

          {/* NEW EVENT FLASH NOTIFICATION */}
          <AnimatePresence>
            {newEventFlash && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-lg"
              >
                <Link href={`/events/${newEventFlash.id}`}>
                  <div className="bg-primary-dark rounded-xl p-4 border border-white/15 flex items-center gap-4 cursor-pointer transition-colors hover:bg-[#9e0000]">
                    <Calendar className="w-6 h-6 text-white flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-semibold">New event</p>
                      <p className="text-white font-black text-lg truncate">{newEventFlash.name}</p>
                      <p className="text-white/75 text-sm flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" aria-hidden="true" /> {newEventFlash.location || "Location to be announced"} · {formatDateOnly(newEventFlash.startDate)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewEventFlash(null); }}
                      aria-label="Dismiss"
                      className="rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <TestimonialsSection />

          {/* DOJO CHRONICLES: one lead story, two follow-ups. */}
          {!dataLoaded ? (
            <Section rhythm="base" width="wide" className="bg-black" aria-busy="true">
              <div className="h-10 w-72 bg-white/5 rounded mb-10 animate-pulse" />
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="aspect-[16/10] bg-white/5 rounded-xl animate-pulse" />
                <div className="space-y-8">
                  <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
                  <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
                </div>
              </div>
            </Section>
          ) : leadPost && (
            <Section rhythm="base" width="wide" className="bg-black">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <Heading>Dojo chronicles</Heading>
                <Link href="/blog" className="group inline-flex min-h-11 items-center gap-2 font-semibold text-white/75 transition-colors hover:text-white">
                  All stories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
                <Reveal kind="depth">
                  <Link href={`/blog/${leadPost.slug}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden rounded-xl bg-surface">
                      {leadPost.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={leadPost.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                      )}
                    </div>
                    <p className="mt-5 text-sm text-white/60">{new Date(leadPost.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <h3 className="mt-2 text-balance text-2xl font-extrabold leading-tight text-white transition-colors group-hover:text-primary-light md:text-3xl">{leadPost.title}</h3>
                    {leadPost.excerpt && <p className="mt-3 max-w-[60ch] text-pretty leading-relaxed text-white/70 line-clamp-3">{leadPost.excerpt}</p>}
                  </Link>
                </Reveal>
                <ul className="divide-y divide-white/10 border-y border-white/10">
                  {morePosts.map((post, i) => (
                    <Reveal as="li" key={post.id} delay={0.1 * (i + 1)}>
                      <Link href={`/blog/${post.slug}`} className="group flex gap-5 py-6">
                        {post.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover grayscale transition duration-500 group-hover:grayscale-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-white/60">{new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          <h3 className="mt-1 text-lg font-bold leading-snug text-white transition-colors group-hover:text-primary-light line-clamp-2">{post.title}</h3>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </ul>
              </div>
            </Section>
          )}

          {/* IN THE MEDIA: a press list, not another card grid. */}
          {dataLoaded && mediaMentions.length > 0 && (
            <Section rhythm="tight" width="wide" className="bg-black">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <Heading size="title" className="text-white/80">In the press</Heading>
                <Link href="/media" className="group inline-flex min-h-11 items-center gap-2 font-semibold text-white/75 transition-colors hover:text-white">
                  All coverage <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {mediaMentions.map((post) => (
                  <li key={post.id}>
                    <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="group grid items-baseline gap-2 py-6 sm:grid-cols-[12rem_1fr_auto] sm:gap-8">
                      <span className="font-semibold text-white/60">{post.sourceName}</span>
                      <span className="text-lg font-bold text-white transition-colors group-hover:text-primary-light md:text-xl">{post.title}</span>
                      <ArrowUpRight className="hidden h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white sm:block" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* TEAM INDIA — renders only when a delegation is published and
              featured, otherwise nothing at all. */}
          <TeamIndiaStrip />

          {/* CLOSING */}
          <Section rhythm="open" width="wide" className="overflow-hidden bg-black">
            <KankuMark className="pointer-events-none absolute -right-[10vw] top-1/2 h-[70vw] max-h-[720px] w-[70vw] max-w-[720px] -translate-y-1/2 text-white/[0.04]" />
            <Reveal kind="mask" duration={1.1}>
              <Heading size="display" className="max-w-[14ch] uppercase">
                Every black belt began as a white belt<span className="text-primary">.</span>
              </Heading>
            </Reveal>
            <Reveal delay={0.15} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <BrandLink href="/register">Become a member</BrandLink>
              <BrandLink href="/belt-system" variant="outline">See the belt path</BrandLink>
            </Reveal>
          </Section>
        </div>
      )}

      {/* Last, not first: anything ahead of the hero stops its negative margin collapsing and shifts the page. */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onFinish={() => { sessionStorage.setItem('splash_seen', 'true'); setShowSplash(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
