"use client";

import { useEffect } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Events Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Events Error</h2>
        <p className="text-gray-400 mb-6">
          Could not load events. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="text-xs text-red-400 font-mono mb-4 break-all">{error.message}</p>
        )}
        <Button onClick={reset} className="bg-red-600 hover:bg-red-700 text-white">
          <RefreshCcw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    </div>
  );
}
