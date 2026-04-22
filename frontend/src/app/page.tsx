"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { ArrowRight, MapPin, Calendar, ChevronRight, X, Clock, Users, Building2, Trophy, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import HeroSectionV2 from "@/components/HeroSectionV2";
import LeadershipSection from "@/components/LeadershipSection";
import MonthlyChampions from "@/components/MonthlyChampions";
import TestimonialsSection from "@/components/TestimonialsSection";
import SectionDivider from "@/components/SectionDivider";

interface Event {
  id: string;
  name: string;
  type: string;
  startDate: string;
  location: string;
}

/* 3D Tilt Image Card */
function TiltImage({ src, alt, caption, sub }: { src: string; alt: string; caption: string; sub: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(y * -15);
    rotateY.set(x * 15);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 8, scale: 0.9 }}
      whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        className="aspect-[4/5] bg-gray-900 rounded-2xl overflow-hidden relative group cursor-none"
      >
        <div className="absolute inset-0 bg-red-600 mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
        />
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent" style={{ transform: 'translateZ(30px)' }}>
          <p className="text-white font-bold tracking-wider uppercase">{caption}</p>
          <p className="text-red-500 text-sm">{sub}</p>
        </div>
      </motion.div>
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 border border-red-600/20 rounded-full animate-spin-slow hidden lg:block" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/5 rounded-full animate-reverse-spin hidden lg:block" />
    </motion.div>
  );
}

/* Animated counter that counts up when scrolled into view */
function AnimatedCounter({ target, label, icon: Icon, suffix = "" }: { target: number; label: string; icon: typeof Users; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || target === 0) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(target / 60));
    const interval = duration / (target / step);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, interval);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center group"
    >
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/10 flex items-center justify-center group-hover:border-red-500/30 group-hover:scale-110 transition-all duration-500">
        <Icon className="w-6 h-6 text-red-500" />
      </div>
      <div className="text-4xl md:text-5xl font-black text-white tabular-nums">
        {count}{suffix}
      </div>
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">{label}</div>
    </motion.div>
  );
}

/* Countdown timer for the next upcoming event */
function NextEventCountdown({ event }: { event: Event }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(event.startDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
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
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent pointer-events-none" />
      <div className="container-responsive text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
          <Clock className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Next Event</span>
        </div>
        <h3 className="text-2xl md:text-4xl font-black mb-2 text-white">{event.name}</h3>
        <p className="text-zinc-500 text-sm mb-8 flex items-center justify-center gap-2">
          <MapPin className="w-3.5 h-3.5" /> {event.location || "Location TBA"} &bull; {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="flex justify-center gap-3 sm:gap-5 mb-10">
          {blocks.map(({ value, label }) => (
            <div key={label} className="relative">
              <div className="w-[72px] h-[80px] sm:w-[88px] sm:h-[96px] bg-gradient-to-b from-zinc-900 to-black rounded-xl border border-white/[0.06] flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                <motion.span
                  key={value}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl sm:text-4xl font-mono font-black text-white"
                >
                  {String(value).padStart(2, "0")}
                </motion.span>
              </div>
              <span className="block text-[10px] text-zinc-600 font-bold uppercase tracking-[0.15em] mt-2">{label}</span>
            </div>
          ))}
        </div>

        <Link href={`/events/${event.id}`}>
          <Button className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95">
            Register Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </motion.section>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);
  const [splashChecked, setSplashChecked] = useState(false);

  // Check splash in useEffect to avoid hydration mismatch
  useEffect(() => {
    const seen = sessionStorage.getItem('splash_seen');
    if (!seen) {
      setShowSplash(true);
    }
    setSplashChecked(true);
  }, []);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [mediaMentions, setMediaMentions] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, any>>({});
  const [newEventFlash, setNewEventFlash] = useState<Event | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [siteStats, setSiteStats] = useState({ dojos: 0, members: 0, events: 0, blackBelts: 0 });
  const { isAuthenticated } = useAuthStore();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

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

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onFinish={() => { sessionStorage.setItem('splash_seen', 'true'); setShowSplash(false); }} />
        )}
      </AnimatePresence>

      {splashChecked && !showSplash && (
        <div>

          {/* CINEMATIC HERO SECTION - V2 "BESTTT" */}
          <HeroSectionV2
            heroOpacity={heroOpacity}
            heroScale={heroScale}
            content={content}
          />

          {/* PHILOSOPHY SECTION — 3D perspective scroll + tilt */}
          <section className="py-10 sm:py-16 md:py-32 relative" style={{ perspective: '1200px' }}>
            <div className="container-responsive">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, rotateY: -8, x: -60 }}
                  whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-8 leading-tight">
                    KEEP YOUR HEAD LOW, <br />
                    <span className="text-red-600">EYES HIGH</span>
                  </h2>
                  <div className="space-y-4 sm:space-y-6 text-gray-400 text-base sm:text-lg leading-relaxed">
                    <p>
                      &ldquo;The heart of our karate is real fighting. There can be no proof without real fighting.
                      Without proof there is no trust. Without trust there is no respect. This is a definition in the world of Martial Arts.&rdquo;
                    </p>
                    <p className="font-serif italic text-xl sm:text-2xl text-white border-l-4 border-red-600 pl-4 sm:pl-6 py-2">
                      — Masutatsu Oyama
                    </p>
                  </div>
                </motion.div>

                {/* 3D Tilt Image */}
                <TiltImage
                  src={content['mas_oyama_image']?.value || "/oyama.png"}
                  alt="Mas Oyama"
                  caption="Sosai Masutatsu Oyama"
                  sub="Founder of Kyokushin"
                />
              </div>
            </div>
          </section>

          <SectionDivider />

          {/* LEADERSHIP SECTION */}
          <LeadershipSection />

          {/* ANIMATED STATS COUNTER */}
          {(siteStats.dojos > 0 || siteStats.members > 0) && (
            <section className="py-16 md:py-28 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.04),transparent_70%)] pointer-events-none" />
              <div className="container-responsive relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  <AnimatedCounter target={siteStats.dojos} label="Dojos" icon={Building2} suffix="+" />
                  <AnimatedCounter target={siteStats.members} label="Members" icon={Users} suffix="+" />
                  <AnimatedCounter target={siteStats.events} label="Events" icon={Trophy} />
                  <AnimatedCounter target={siteStats.blackBelts} label="Black Belts" icon={Award} />
                </div>
              </div>
            </section>
          )}

          {/* NEXT EVENT COUNTDOWN */}
          {featuredEvents.length > 0 && new Date(featuredEvents[0].startDate) > new Date() && (
            <NextEventCountdown event={featuredEvents[0]} />
          )}

          {/* MONTHLY CHAMPIONS */}
          <MonthlyChampions />

          <SectionDivider />

          {/* NEW EVENT FLASH NOTIFICATION */}
          <AnimatePresence>
            {newEventFlash && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-lg"
              >
                <Link href={`/events/${newEventFlash.id}`}>
                  <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 rounded-2xl p-4 shadow-2xl shadow-red-900/40 border border-red-500/30 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-bold uppercase tracking-widest">New Event</p>
                      <p className="text-white font-black text-lg truncate">{newEventFlash.name}</p>
                      <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {newEventFlash.location || "Location TBA"} • {new Date(newEventFlash.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewEventFlash(null); }}
                      className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-90"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TESTIMONIALS / SUCCESS STORIES - moved up */}
          <TestimonialsSection />

          {/* LATEST NEWS SECTION - only render when there are blog posts */}
          {!dataLoaded ? (
            <section className="py-10 sm:py-16 md:py-24 bg-black">
              <div className="container-responsive">
                <div className="h-8 w-64 bg-white/5 rounded-lg mb-8 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 animate-pulse">
                      <div className="aspect-video bg-white/5" />
                      <div className="p-6 space-y-3">
                        <div className="h-3 w-20 bg-white/5 rounded" />
                        <div className="h-5 w-full bg-white/5 rounded" />
                        <div className="h-3 w-3/4 bg-white/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : latestBlogs.length > 0 && (
            <section className="py-10 sm:py-16 md:py-24 bg-black relative">
              <div className="container-responsive">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 md:mb-12 gap-4">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter">
                    DOJO <span className="text-red-600">CHRONICLES</span>
                  </h2>
                  <Link href="/blog" className="flex items-center gap-2 text-red-500 md:text-gray-400 hover:text-white transition-colors text-sm md:text-base font-semibold md:font-normal">
                    Read All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                  {latestBlogs.map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                      <article className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 hover:border-red-600/50 transition-all duration-300 h-full flex flex-col">
                        <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold">NO IMAGE</div>
                          )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="text-xs text-gray-500 mb-2">{new Date(post.publishedAt).toLocaleDateString()}</div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors line-clamp-2">{post.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
                          <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Read More</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* MEDIA SECTION - only render when there are media mentions */}
          {dataLoaded && mediaMentions.length > 0 && (
            <section className="py-10 sm:py-16 md:py-24 bg-zinc-950 relative">
              <div className="container-responsive">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 md:mb-12 gap-4">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter">
                    IN THE <span className="text-red-600">MEDIA</span>
                  </h2>
                  <Link href="/media" className="flex items-center gap-2 text-red-500 md:text-gray-400 hover:text-white transition-colors text-sm md:text-base font-semibold md:font-normal">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                  {mediaMentions.map((post) => (
                    <a href={post.externalLink} target="_blank" rel="noopener noreferrer" key={post.id} className="group block">
                      <article className="bg-black rounded-2xl overflow-hidden border border-white/10 hover:border-red-600/50 transition-all duration-300 h-full">
                        <div className="aspect-[2/1] bg-zinc-900 relative overflow-hidden">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold">MEDIA</div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">{post.sourceName}</div>
                          <h3 className="text-lg font-bold mb-1 group-hover:text-red-500 transition-colors">{post.title}</h3>
                        </div>
                      </article>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA SECTION */}
          <section className="py-16 sm:py-20 md:py-28 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="container-responsive text-center relative z-10 flex flex-col items-center">
              <img src="/kkfi-logo.png" alt="KKFI" className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/10 shadow-[0_0_20px_rgba(220,38,38,0.15)] mb-6 opacity-60" />
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight mb-6">
                Ready to start your <span style={{
                  background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}>journey?</span>
              </h3>
              <Link href="/register">
                <Button className="h-12 md:h-14 px-8 md:px-10 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95">
                  Become a Member
                </Button>
              </Link>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
