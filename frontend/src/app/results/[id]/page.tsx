"use client";

import { use, useEffect, useState } from "react";
import SceneSlot from "@/components/three/SceneSlot";
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
    // Transparent at the top: the podium scene shows through from the canvas behind <main>.
    <div className="min-h-dvh text-white">
      {/* Opener: the sheet's title and dates beside a podium in 3D. */}
      <header data-bleed className="relative flex min-h-[84svh] overflow-hidden md:min-h-[76svh]">
        <SceneSlot
          scene="podium"
          sceneProps={PODIUM_PROPS}
          className="absolute inset-x-0 top-0 h-[46svh] md:inset-0 md:h-auto"
          fallback={
            <div className="absolute inset-0 bg-black">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_55%,rgba(212,160,23,0.14),transparent_55%)]" />
              <div className="absolute right-[10%] top-1/2 hidden -translate-y-1/2 md:block"><KkfiCrest size={200} glow={false} /></div>
              <div className="absolute left-1/2 top-[20%] -translate-x-1/2 md:hidden"><KkfiCrest size={110} glow={false} /></div>
            </div>
          }
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_46%,transparent_64%)] md:bg-gradient-to-r md:from-black/90 md:via-black/40 md:via-45% md:to-transparent" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-12 pt-[42svh] sm:px-6 md:justify-center md:pb-14 md:pt-40 lg:px-8">
          <Link href="/results" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All results
          </Link>
          <p className="mt-6 text-sm font-semibold text-white/70">Official grading result</p>
          <h1 className="mt-3 max-w-[15ch] text-balance text-[clamp(2rem,4.4vw,3.25rem)] font-black uppercase leading-[0.98] tracking-[-0.025em]">
            {result.title}
          </h1>
          {meta.length > 0 && (
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-10 gap-y-5 border-t border-white/15 pt-6 sm:flex sm:flex-wrap">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="text-sm text-white/60">{m.label}</dt>
                  <dd className="mt-1 font-bold text-white tabular-nums">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </header>

      <div className="bg-black">
      {/* Same column as the hero copy; the sheet itself keeps a readable width. */}
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <div>
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
        <figure className="mt-12 max-w-4xl">
          <figcaption className="mb-3 text-sm font-semibold text-white/60">Certified result sheet</figcaption>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-surface p-2 sm:p-4">
            <ResultPdfViewer url={pdfHref} />
          </div>
        </figure>
      </div>
      </div>
    </div>
  );
}

/** A grading sheet has no podium of names: the steps stay unlabelled. Stable object, so the slot never re-registers. */
const PODIUM_PROPS = {};
