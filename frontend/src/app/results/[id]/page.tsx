"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import KkfiCrest from "@/components/results/KkfiCrest";
import KarateLoader from "@/components/KarateLoader";
import BrandLink from "@/components/brand/BrandLink";

import { formatDateOnly } from '@/lib/dateOnly';
const ResultPdfViewer = dynamic(() => import("@/components/results/ResultPdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-20">
      <KarateLoader label="Opening the sheet" />
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
  return formatDateOnly(d, { day: "2-digit", month: "short", year: "numeric" }, "en-IN");
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/exam-results/${id}`)
      .then((res) => setResult(res.data.data.result))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center bg-black">
        <KarateLoader label="Loading result" />
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4 text-white sm:px-6">
        <KkfiCrest size={72} glow={false} />
        <div>
          <h1 className="text-3xl font-black uppercase tracking-[-0.02em]">Result not found<span className="text-primary">.</span></h1>
          <p className="mt-3 leading-relaxed text-white/70">This result may have been removed or is no longer published.</p>
        </div>
        <BrandLink href="/results" variant="outline">
          <ArrowLeft className="h-4 w-4" /> All results
        </BrandLink>
      </div>
    );
  }

  const pdfHref = getImageUrl(result.pdfUrl) || result.pdfUrl;
  const meta = [
    { label: "Tested", value: fmt(result.testDate) },
    { label: "Awarded", value: fmt(result.awardedDate) },
    { label: "Venue", value: result.location },
  ].filter((m) => m.value);

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 md:pt-10">
        <Link href="/results" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All results
        </Link>

        <header className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-white/60">Official grading result</p>
            <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[0.98] tracking-[-0.025em]">
              {result.title}
            </h1>
            {meta.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-x-10 gap-y-5 border-t border-white/15 pt-6 sm:flex sm:flex-wrap">
                {meta.map((m) => (
                  <div key={m.label}>
                    <dt className="text-sm text-white/60">{m.label}</dt>
                    <dd className="mt-1 font-bold text-white tabular-nums">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <KkfiCrest size={96} glow={false} className="hidden md:block" />
        </header>

        <div className="mt-10">
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-none bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            Download PDF
          </a>
        </div>

        {/* The sheet itself, on a plain mount like a framed document. */}
        <figure className="mt-12">
          <figcaption className="mb-3 text-sm font-semibold text-white/60">Certified result sheet</figcaption>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-surface p-2 sm:p-4">
            <ResultPdfViewer url={pdfHref} />
          </div>
        </figure>
      </div>
    </div>
  );
}
