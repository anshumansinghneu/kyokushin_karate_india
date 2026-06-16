"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, MapPin, Award, Download, Loader2, ArrowLeft, ScrollText } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import KkfiCrest from "@/components/results/KkfiCrest";

const ResultPdfViewer = dynamic(() => import("@/components/results/ResultPdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-red-500" />
    </div>
  ),
});

interface ExamResult {
  id: string;
  title: string;
  testDate: string | null;
  awardedDate: string | null;
  location: string | null;
  pdfUrl: string;
}

function fmt(d: string | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function MetaPill({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-gray-200 backdrop-blur-md">
      <Icon className="h-4 w-4 text-red-400" />
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </span>
  );
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    api
      .get(`/exam-results/${id}`)
      .then((res) => setResult(res.data.data.result))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080808]">
        <Loader2 className="h-7 w-7 animate-spin text-red-500" />
      </main>
    );
  }

  if (notFound || !result) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#080808] px-6 text-center text-white">
        <KkfiCrest size={84} />
        <div>
          <p className="text-lg font-semibold">Result not found</p>
          <p className="mt-1 text-sm text-gray-400">This result may have been removed or is no longer published.</p>
        </div>
        <Link
          href="/results"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200 transition hover:border-red-500/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>
      </main>
    );
  }

  const pdfHref = getImageUrl(result.pdfUrl) || result.pdfUrl;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#080808] text-white">
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] bg-[radial-gradient(55%_100%_at_50%_0%,rgba(220,38,38,0.15),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,#0c0c0c,#080808_35%)]" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
        <Link
          href="/results"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> All results
        </Link>

        {/* Header */}
        <motion.header
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-7 flex flex-col items-center text-center"
        >
          <KkfiCrest size={88} />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.35em] text-red-400/80">
            Official Grading Result
          </p>
          <h1 className="mt-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            {result.title}
          </h1>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {fmt(result.testDate) && <MetaPill icon={Calendar} label="Test" value={fmt(result.testDate)!} />}
            {fmt(result.awardedDate) && <MetaPill icon={Award} label="Awarded" value={fmt(result.awardedDate)!} />}
            {result.location && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white backdrop-blur-md">
                <MapPin className="h-4 w-4 text-red-400" />
                {result.location}
              </span>
            )}
          </div>

          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(220,38,38,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            Download PDF
          </a>
        </motion.header>

        {/* Document frame */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl sm:p-5"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
          <div className="mb-3 flex items-center gap-2 px-1 text-xs text-gray-500">
            <ScrollText className="h-3.5 w-3.5 text-red-400/70" />
            Certified result sheet
          </div>
          <ResultPdfViewer url={pdfHref} />
        </motion.div>

        <p className="mt-8 text-center text-xs text-gray-600">
          Kyokushin Karate Foundation of India · Osu no Seishin
        </p>
      </div>
    </main>
  );
}
