"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Calendar, MapPin, Loader2 } from "lucide-react";
import api from "@/lib/api";

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

  useEffect(() => {
    api.get("/exam-results")
      .then((res) => setResults(res.data.data.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl">Belt Test Results</h1>
          <p className="mt-2 text-sm text-gray-400">Official published results. Open one to view the full list.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>
        ) : results.length === 0 ? (
          <p className="py-20 text-center text-gray-500">No results published yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/results/${r.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-red-500/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-900/30 p-2.5"><FileText className="h-5 w-5 text-red-400" /></div>
                    <h2 className="flex-1 text-lg font-semibold leading-snug group-hover:text-red-300">{r.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    {formatDate(r.testDate) && (
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(r.testDate)}</span>
                    )}
                    {r.location && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.location}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
