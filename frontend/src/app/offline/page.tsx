'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Kanku mark */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#FF0000] flex items-center justify-center">
          <span className="text-5xl font-extrabold text-white">K</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">
          YOU&apos;RE <span className="text-[#FF0000]">OFFLINE</span>
        </h1>

        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          No internet connection detected. Check your connection and try again.
          A true Kyokushin fighter never gives up — keep trying!
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-[44px] px-8 py-4 bg-[#FF0000] hover:bg-[#8B0000] text-white font-bold uppercase tracking-wider rounded-none transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            OSU! Try Again
          </button>

          <p className="text-xs text-gray-400">
            Previously visited pages may still be available offline.
          </p>
        </div>
      </div>
    </div>
  );
}
