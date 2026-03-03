"use client";

import { useEffect } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Dashboard Error</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Something went wrong loading the dashboard. Your data is safe.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="text-xs text-red-400/70 font-mono mb-4 break-all bg-red-500/5 rounded-xl p-3 border border-red-500/10">{error.message}</p>
        )}
        <Button onClick={reset} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl">
          <RefreshCcw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    </div>
  );
}
