"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Only check auth if we're not already authenticated
        if (!isAuthenticated) {
            checkAuth();
        }
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const isExpired = user.membershipStatus === "EXPIRED";

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />
            <div className="absolute inset-0 bg-[url('/dojo-bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Membership Expiry Banner */}
                {isExpired && user.role !== "ADMIN" && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-300">Membership Expired</p>
                                <p className="text-xs text-zinc-400">Your annual membership has expired. Renew now to continue accessing all features.</p>
                            </div>
                        </div>
                        <Link
                            href="/renew-membership"
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap min-h-[44px] flex items-center active:scale-95"
                        >
                            Renew ₹295
                        </Link>
                    </div>
                )}

                <StudentDashboard user={user} />
            </div>
        </div>
    );
}
