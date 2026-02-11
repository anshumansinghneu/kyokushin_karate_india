"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { ArrowRight, MapPin, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
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
  const [showSplash, setShowSplash] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [mediaMentions, setMediaMentions] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, any>>({});
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
        setFeaturedEvents(eventsRes.value.data.data.events.slice(0, 5));
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
          <SplashScreen key="splash" onFinish={() => setShowSplash(false)} />
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
          <section className="py-32 relative">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                    KEEP YOUR HEAD LOW, <br />
                    <span className="text-red-600">EYES HIGH</span>
                  </h2>
                  <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                    <p>
                      "The heart of our karate is real fighting. There can be no proof without real fighting.
                      Without proof there is no trust. Without trust there is no respect. This is a definition in the world of Martial Arts."
                    </p>
                    <p className="font-serif italic text-2xl text-white border-l-4 border-red-600 pl-6 py-2">
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
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 border border-red-600/20 rounded-full animate-spin-slow" />
                  <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/5 rounded-full animate-reverse-spin" />
                </motion.div>
              </div>
            </div>
          </section>

          {/* LEADERSHIP SECTION */}
          <LeadershipSection />

          {/* MONTHLY CHAMPIONS */}
          <MonthlyChampions />

          {/* FEATURED EVENTS CAROUSEL */}
          <section className="py-32 bg-zinc-950 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("/noise.png")' }} />

            <div className="container mx-auto px-4 relative z-10">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                    UPCOMING <span className="text-red-600">BATTLES</span>
                  </h2>
                  <p className="text-gray-400">Witness the strength. Join the fight.</p>
                </div>
                <Link href="/events" className="hidden md:flex items-center gap-2 text-white hover:text-red-500 transition-colors group">
                  View All Events <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory scrollbar-hide">
                {featuredEvents.length > 0 ? (
                  featuredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="min-w-[300px] md:min-w-[400px] snap-center"
                    >
                      <Link href={`/events/${event.id}`}>
                        <div className="group relative h-[500px] bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 hover:border-red-600/50 transition-all duration-500">
                          {/* Date Badge */}
                          <div className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center min-w-[70px]">
                            <span className="block text-xs font-bold text-red-500 uppercase">
                              {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="block text-2xl font-black text-white">
                              {new Date(event.startDate).getDate()}
                            </span>
                          </div>

                          {/* Default Event Background */}
                          <div className="absolute inset-0 bg-zinc-800">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                            <div className={`absolute inset-0 bg-gradient-to-br ${event.type === 'TOURNAMENT' ? 'from-red-900/40 via-zinc-900 to-black' : event.type === 'CAMP' ? 'from-green-900/40 via-zinc-900 to-black' : 'from-blue-900/40 via-zinc-900 to-black'}`} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.07]">
                              <svg viewBox="0 0 100 100" className="w-32 h-32" fill="currentColor">
                                <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="900" className="text-white">OSU</text>
                                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
                              </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                          </div>

                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <span className="inline-block px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                              {event.type}
                            </span>
                            <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-red-500 transition-colors">
                              {event.name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 mb-6">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{event.location || "Location TBA"}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                              REGISTER NOW <ChevronRight className="w-4 h-4 text-red-500" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="w-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                    <p className="text-gray-500">No upcoming events scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* LATEST NEWS SECTION */}
          <section className="py-24 bg-black relative">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-end mb-12">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                  DOJO <span className="text-red-600">CHRONICLES</span>
                </h2>
                <Link href="/blog" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  Read All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

          {/* MEDIA SECTION */}
          <section className="py-24 bg-zinc-950 relative">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-end mb-12">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                  IN THE <span className="text-red-600">MEDIA</span>
                </h2>
                <Link href="/media" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

          {/* TESTIMONIALS */}
          <TestimonialsSection />

          {/* CTA SECTION */}
          <section className="py-32 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-red-900/20" />
            <div className="container mx-auto px-4 text-center relative z-10">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 opacity-20 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none">
                KYOKUSHIN
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold mb-8 relative">
                READY TO START YOUR JOURNEY?
              </h3>
              <Link href="/register">
                <Button className="h-16 px-10 rounded-full bg-white text-black hover:bg-gray-200 text-xl font-bold tracking-wide transition-transform hover:scale-105">
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
