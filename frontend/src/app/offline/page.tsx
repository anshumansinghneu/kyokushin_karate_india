'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Kanku mark */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-b from-red-500 to-red-900 flex items-center justify-center shadow-2xl shadow-red-900/40">
          <span className="text-5xl font-black text-white">K</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
          YOU&apos;RE <span className="text-red-500">OFFLINE</span>
        </h1>

        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          No internet connection detected. Check your connection and try again.
          A true Kyokushin fighter never gives up — keep trying!
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all active:scale-95 text-lg"
          >
            OSU! Try Again
          </button>

          <p className="text-xs text-gray-600">
            Previously visited pages may still be available offline.
          </p>
        </div>
      </div>
    </div>
  );
}
