"use client";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-red-600/15" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-red-400/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-white text-sm font-bold">Loading Dashboard</p>
          <p className="text-gray-600 text-xs mt-0.5">Preparing your dojo...</p>
        </div>
      </div>
    </div>
  );
}
