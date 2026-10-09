"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useScroll } from "framer-motion";
import SceneSlot from "@/components/three/SceneSlot";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import api from "@/lib/api";
import KkfiCrest from "@/components/results/KkfiCrest";
import Reveal from "@/components/brand/Reveal";
import { Heading } from "@/components/brand/Section";

import { formatDateOnly } from '@/lib/dateOnly';
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
  return formatDateOnly(d, { day: "2-digit", month: "short", year: "numeric" }, "en-IN");
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/exam-results")
      // Newest grading first; undated sheets fall back to when they were published.
      .then((res) => setResults(
        [...(res.data.data.results as ExamResult[])].sort((a, b) => (b.testDate ?? b.createdAt).localeCompare(a.testDate ?? a.createdAt)),
      ))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Transparent: the podium scene shows through from the canvas behind <main>.
    <div className="min-h-dvh text-white">
      <ResultsHero />

      <section aria-labelledby="results-heading" className="bg-black">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <Heading size="title" className="text-white/80">
            <span id="results-heading">Published gradings</span>
          </Heading>
          {!loading && results.length > 0 && (
            <p className="text-sm text-white/60 tabular-nums">{results.length} {results.length === 1 ? "sheet" : "sheets"}</p>
          )}
        </div>

        {loading ? (
          <ul aria-busy="true" className="divide-y divide-white/10 border-y border-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="py-7">
                <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-white/5" />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <div className="border-y border-white/10 py-16">
            <p className="text-2xl font-extrabold text-white">No results published yet.</p>
            <p className="mt-3 max-w-[46ch] leading-relaxed text-white/70">
              Grading results appear here once they are released by the examining board. Check back after
              your grading, or ask your instructor.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {results.map((r, i) => (
              <Reveal as="li" key={r.id} delay={Math.min(i * 0.04, 0.3)}>
                <Link
                  href={`/results/${r.id}`}
                  className="group grid items-baseline gap-x-8 gap-y-2 py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:grid-cols-[9rem_1fr_auto]"
                >
                  <span className="text-sm font-semibold text-white/60 tabular-nums">{formatDate(r.testDate) ?? "Date to be confirmed"}</span>
                  <span>
                    <span className="block text-pretty text-lg font-extrabold leading-snug text-white transition-colors group-hover:text-primary-light md:text-xl">
                      {r.title}
                    </span>
                    {r.location && (
                      <span className="mt-1.5 flex items-center gap-1.5 text-sm text-white/60">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {r.location}
                      </span>
                    )}
                  </span>
                  <span className="hidden items-center gap-2 text-sm font-semibold text-white/60 transition-colors group-hover:text-white sm:flex">
                    Open sheet
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
        </div>
      </section>
    </div>
  );
}

/** Static composition for the podium: the crest over a faint lit stage. */
function PodiumPoster() {
  return (
    <div className="absolute inset-0 bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_55%,rgba(212,160,23,0.14),transparent_55%)]" />
      <div className="absolute right-[8%] top-1/2 hidden -translate-y-1/2 md:block">
        <KkfiCrest size={220} glow={false} />
      </div>
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 md:hidden">
        <KkfiCrest size={120} glow={false} />
      </div>
    </div>
  );
}

/** Full-bleed opener: the podium in 3D, the title beside it. */
function ResultsHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneProps = useMemo(() => ({ progress: scrollYProgress }), [scrollYProgress]);
  return (
    <header ref={ref} data-bleed className="relative flex min-h-[86svh] overflow-hidden md:min-h-[80svh]">
      <SceneSlot
        scene="podium"
        sceneProps={sceneProps}
        className="absolute inset-x-0 top-0 h-[54svh] md:inset-0 md:h-auto"
        fallback={<PodiumPoster />}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_40%,transparent_62%)] md:bg-gradient-to-r md:from-black/85 md:via-black/30 md:via-45% md:to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-12 pt-[50svh] sm:px-6 md:justify-center md:pb-16 md:pt-40 lg:px-8">
        <p className="text-sm font-semibold text-white/70">Kyokushin Karate Foundation of India</p>
        <h1 className="mt-4 max-w-[12ch] text-balance text-[clamp(2.75rem,8vw,5.5rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
          Belt test results<span className="text-primary">.</span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80">
          Official grading results. Find your name, confirm your rank, and open the certified result
          sheet, straight from the dojo.
        </p>
      </div>
    </header>
  );
}
