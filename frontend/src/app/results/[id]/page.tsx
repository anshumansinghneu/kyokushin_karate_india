"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Calendar, MapPin, Award, Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";

const ResultPdfViewer = dynamic(() => import("@/components/results/ResultPdfViewer"), {
  ssr: false,
  loading: () => <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>,
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

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/exam-results/${id}`)
      .then((res) => setResult(res.data.data.result))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#080808]"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></main>;
  }

  if (notFound || !result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808] text-white">
        <p className="text-gray-400">Result not found.</p>
        <Link href="/results" className="text-sm text-red-400 hover:underline">← Back to results</Link>
      </main>
    );
  }

  const pdfHref = getImageUrl(result.pdfUrl) || result.pdfUrl;

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/results" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All results
        </Link>

        <h1 className="text-2xl font-bold sm:text-3xl">{result.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
          {fmt(result.testDate) && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />Test: {fmt(result.testDate)}</span>}
          {fmt(result.awardedDate) && <span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4" />Awarded: {fmt(result.awardedDate)}</span>}
          {result.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{result.location}</span>}
        </div>

        <a href={pdfHref} target="_blank" rel="noopener noreferrer"
           className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          <Download className="h-4 w-4" /> Download PDF
        </a>

        <div className="mt-8">
          <ResultPdfViewer url={pdfHref} />
        </div>
      </div>
    </main>
  );
}
