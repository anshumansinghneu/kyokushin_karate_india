"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function TournamentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tournaments Error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4 text-white sm:px-6">
      <h1 className="text-3xl font-black uppercase tracking-[-0.02em]">
        The tournament could not load<span className="text-primary">.</span>
      </h1>
      <p className="leading-relaxed text-white/70">
        The server did not answer in time. This usually clears up on a second try.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <p className="break-all font-mono text-xs text-white/50">{error.message}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="inline-flex min-h-12 items-center gap-2 bg-primary px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
        <Link
          href="/events"
          className="inline-flex min-h-12 items-center border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
        >
          All events
        </Link>
      </div>
    </div>
  );
}
