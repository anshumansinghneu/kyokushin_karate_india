"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { ArrowRight, MapPin, Calendar, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import HeroSectionV2 from "@/components/HeroSectionV2";
import LeadershipSection from "@/components/LeadershipSection";
import MonthlyChampions from "@/components/MonthlyChampions";
import TestimonialsSection from "@/components/TestimonialsSection";

interface Event {
  id: string;
  name: string;
  type: string;
  startDate: string;
  location: string;
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('splash_seen');
    }
    return true;
  });
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [mediaMentions, setMediaMentions] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, any>>({});
  const [newEventFlash, setNewEventFlash] = useState<Event | null>(null);
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
        api.get('/posts?type=MEDIA_MENTION')
      ]);

      const [eventsRes, contentRes, blogsRes, mediaRes] = results;

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

      {!showSplash && (
        <div className="animate-fade-in">

          {/* CINEMATIC HERO SECTION - V2 "BESTTT" */}
          <HeroSectionV2
            heroOpacity={heroOpacity}
            heroScale={heroScale}
            content={content}
          />

          {/* PHILOSOPHY SECTION (Parallax) */}
          <section className="py-10 sm:py-16 md:py-32 relative">
            <div className="container mx-auto px-3 sm:px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-8 leading-tight">
                    KEEP YOUR HEAD LOW, <br />
                    <span className="text-red-600">EYES HIGH</span>
                  </h2>
                  <div className="space-y-4 sm:space-y-6 text-gray-400 text-base sm:text-lg leading-relaxed">
                    <p>
                      "The heart of our karate is real fighting. There can be no proof without real fighting.
                      Without proof there is no trust. Without trust there is no respect. This is a definition in the world of Martial Arts."
                    </p>
                    <p className="font-serif italic text-xl sm:text-2xl text-white border-l-4 border-red-600 pl-4 sm:pl-6 py-2">
                      — Masutatsu Oyama
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="aspect-[4/5] bg-gray-900 rounded-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-red-600 mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    <img
                      src={content['mas_oyama_image']?.value || "/oyama.png"}
                      alt="Mas Oyama"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent">
                      <p className="text-white font-bold tracking-wider uppercase">Sosai Masutatsu Oyama</p>
                      <p className="text-red-500 text-sm">Founder of Kyokushin</p>
                    </div>
                  </div>
                  {/* Decorative elements - hidden on mobile */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 border border-red-600/20 rounded-full animate-spin-slow hidden lg:block" />
                  <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/5 rounded-full animate-reverse-spin hidden lg:block" />
                </motion.div>
              </div>
            </div>
          </section>

          {/* LEADERSHIP SECTION */}
          <LeadershipSection />

          {/* MONTHLY CHAMPIONS */}
          <MonthlyChampions />

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
          {latestBlogs.length > 0 && (
            <section className="py-10 sm:py-16 md:py-24 bg-black relative">
              <div className="container mx-auto px-3 sm:px-4">
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
          {mediaMentions.length > 0 && (
            <section className="py-10 sm:py-16 md:py-24 bg-zinc-950 relative">
              <div className="container mx-auto px-3 sm:px-4">
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
          <section className="py-12 sm:py-20 md:py-32 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-red-900/20" />
            <div className="container mx-auto px-3 sm:px-4 text-center relative z-10">
              <h2 className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-6 sm:mb-8 opacity-20 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none hidden sm:block">
                KYOKUSHIN
              </h2>
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 sm:mb-8 relative">
                READY TO START YOUR JOURNEY?
              </h3>
              <Link href="/register">
                <Button className="h-14 md:h-16 px-8 md:px-10 rounded-full bg-white text-black hover:bg-gray-200 text-base sm:text-lg md:text-xl font-bold tracking-wide transition-transform hover:scale-105 active:scale-95 min-h-[44px]">
                  BECOME A MEMBER
                </Button>
              </Link>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
