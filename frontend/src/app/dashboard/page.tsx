"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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

    // Show minimal placeholder while loading user data (token exists but no user yet)
    if (!user && isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-red-600/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Loading your dojo...</p>
                </div>
            </div>
        );
    }

    if (isLoading && !isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-red-600/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Loading your dojo...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const isExpired = user.membershipStatus === "EXPIRED";

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden selection:bg-red-600 selection:text-white">
            {/* Background layers */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_var(--tw-gradient-stops))] from-red-950/25 via-black to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_var(--tw-gradient-stops))] from-zinc-800/10 via-transparent to-transparent" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
            </div>

            <div className="container-responsive py-6 md:py-8 relative z-10">
                {/* Membership Expiry Banner */}
                {isExpired && user.role !== "ADMIN" && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-300">Membership Expired</p>
                                <p className="text-xs text-zinc-400">Your annual membership has expired. Renew now to continue accessing all features.</p>
                            </div>
                        </div>
                        <Link
                            href="/renew-membership"
                            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold rounded-xl transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 active:scale-95 shadow-lg shadow-red-900/30"
                        >
                            Renew ₹295 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}

                <StudentDashboard user={user} />
            </div>
        </div>
    );
}
