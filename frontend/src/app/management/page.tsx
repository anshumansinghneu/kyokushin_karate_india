"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import { Shield, RefreshCw, AlertTriangle, BarChart, Users, Calendar, FileText } from "lucide-react";

/* ---------- Skeleton Loader – mimics the real sidebar + content layout ---------- */
function ManagementSkeleton({ message, showRetry, onRetry }: { message: string; showRetry?: boolean; onRetry?: () => void }) {
    return (
        <div className="min-h-screen w-full bg-[#080808] flex overflow-hidden">
            {/* Fake sidebar */}
            <div className="hidden lg:flex flex-col w-[260px] border-r border-white/[0.06] bg-[#0b0b0b] flex-shrink-0">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                    <div className="w-9 h-9 rounded-xl bg-red-900/40 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-2 w-14 bg-white/[0.04] rounded animate-pulse" />
                    </div>
                </div>
                {/* Menu items skeleton */}
                <div className="flex-1 px-3 py-4 space-y-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${i === 1 ? 'bg-white/[0.04]' : ''}`}>
                            <div className="w-[18px] h-[18px] rounded bg-white/[0.06] animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                            <div className="h-2.5 rounded bg-white/[0.06] animate-pulse" style={{ width: `${60 + (i * 11) % 40}%`, animationDelay: `${i * 80}ms` }} />
                        </div>
                    ))}
                    <div className="h-px bg-white/[0.04] mx-2 my-3" />
                    {[9, 10, 11, 12].map(i => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                            <div className="w-[18px] h-[18px] rounded bg-white/[0.06] animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                            <div className="h-2.5 rounded bg-white/[0.06] animate-pulse" style={{ width: `${50 + (i * 13) % 40}%`, animationDelay: `${i * 80}ms` }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Fake main area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar skeleton */}
                <div className="h-14 border-b border-white/[0.06] bg-[#080808]/80 flex items-center px-6 gap-3">
                    <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-3 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
                </div>

                {/* Content area */}
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-5 max-w-md text-center">
                        {/* Animated icon */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-500/60" />
                            </div>
                            {!showRetry && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#080808] border border-white/[0.06] flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 border-2 border-red-500/60 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {showRetry && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#080808] border border-amber-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-[13px] font-medium text-gray-400">{message}</p>
                            {!showRetry && (
                                <p className="text-[11px] text-gray-600 mt-1 font-mono">Authenticating session...</p>
                            )}
                        </div>

                        {showRetry && onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Try Again
                            </button>
                        )}

                        {/* Fake stat cards preview */}
                        {!showRetry && (
                            <div className="grid grid-cols-4 gap-2 w-full mt-4 opacity-[0.15]">
                                {[BarChart, Users, Calendar, FileText].map((Icon, i) => (
                                    <div key={i} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <Icon className="w-4 h-4 text-white/40 mb-2" />
                                        <div className="h-5 w-8 bg-white/[0.08] rounded animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ManagementContent() {
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'overview';
    const [loadingTooLong, setLoadingTooLong] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            checkAuth();
        }
    }, []);

    // Timeout: if still loading after 12s, show retry option
    useEffect(() => {
        if (!isLoading) {
            setLoadingTooLong(false);
            return;
        }
        const timer = setTimeout(() => setLoadingTooLong(true), 12000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
                router.push("/dashboard");
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    const handleRetry = () => {
        setLoadingTooLong(false);
        // Reset the auth guard so checkAuth will actually run again
        useAuthStore.setState({ _hasCheckedAuth: false, isLoading: true });
        checkAuth();
    };

    if (isLoading) {
        return (
            <ManagementSkeleton
                message={loadingTooLong ? "Connection is taking longer than expected" : "Loading management console"}
                showRetry={loadingTooLong}
                onRetry={handleRetry}
            />
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen w-full bg-[#080808] text-white relative overflow-hidden">
            {/* Subtle ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-950/[0.08] rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="relative z-10 h-screen">
                {user.role === 'ADMIN' && <AdminDashboard user={user} initialTab={initialTab} />}
                {user.role === 'INSTRUCTOR' && <InstructorDashboard user={user} initialTab={initialTab} />}
            </div>
        </div>
    );
}

export default function ManagementPage() {
    return (
        <Suspense fallback={
            <ManagementSkeleton message="Loading management console" />
        }>
            <ManagementContent />
        </Suspense>
    );
}
