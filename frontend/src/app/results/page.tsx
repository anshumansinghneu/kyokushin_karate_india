"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, MapPin, ArrowUpRight, Award, ScrollText } from "lucide-react";
import api from "@/lib/api";
import KkfiCrest from "@/components/results/KkfiCrest";

interface ExamResult {
  id: string;
  title: string;
  testDate: string | null;
  awardedDate: string | null;
  location: string | null;
  createdAt: string;
}

function formatDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    api
      .get("/exam-results")
      .then((res) => setResults(res.data.data.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#080808] text-white">
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(220,38,38,0.16),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,#0c0c0c,#080808_40%)]" />

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
        {/* Hero */}
        <header className="flex flex-col items-center text-center">
          <KkfiCrest size={108} />
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-7 text-[11px] font-semibold uppercase tracking-[0.35em] text-red-400/80"
          >
            Kyokushin Karate Foundation of India
          </motion.p>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-3 bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl"
          >
            Belt Test Results
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base"
          >
            Official grading results. Find your name, confirm your rank, and view the certified
            result sheet — straight from the dojo.
          </motion.p>
          <div className="mt-8 h-px w-28 bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />
        </header>

        {/* Content */}
        <section className="mt-14">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]"
                  style={{ animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white/[0.02] px-8 py-16 text-center backdrop-blur-xl">
              <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-4">
                <ScrollText className="h-7 w-7 text-red-400" />
              </div>
              <p className="mt-5 text-lg font-semibold text-white">No results published yet</p>
              <p className="mt-2 text-sm text-gray-400">
                Grading results will appear here once they&apos;re released. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.4), ease: "easeOut" }}
                >
                  <Link
                    href={`/results/${r.id}`}
                    className="group relative flex h-full min-h-[176px] flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_-20px_rgba(220,38,38,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                  >
                    {/* top accent */}
                    <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {/* watermark crest */}
                    <Image
                      src="/kkfi-logo.png"
                      alt=""
                      aria-hidden
                      width={120}
                      height={120}
                      className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.09]"
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-3">
                        <Award className="h-5 w-5 text-red-400" />
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-gray-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red-400" />
                    </div>

                    <h2 className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-red-50">
                      {r.title}
                    </h2>

                    <div className="mt-auto flex flex-wrap gap-2">
                      {formatDate(r.testDate) && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300">
                          <Calendar className="h-3.5 w-3.5 text-red-400/80" />
                          {formatDate(r.testDate)}
                        </span>
                      )}
                      {r.location && (
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400/80" />
                          <span className="truncate">{r.location}</span>
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
