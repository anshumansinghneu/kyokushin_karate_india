"use client";

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-red-600/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin" />
        </div>
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
