"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import { Loader2 } from "lucide-react";

function ManagementContent() {
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'overview';

    useEffect(() => {
        // Only check auth if we're not already authenticated
        if (!isAuthenticated) {
            checkAuth();
        }
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
                router.push("/dashboard");
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

            <div className="container-responsive py-8 relative z-10">
                {user.role === 'ADMIN' && <AdminDashboard user={user} initialTab={initialTab} />}
                {user.role === 'INSTRUCTOR' && <InstructorDashboard user={user} initialTab={initialTab} />}
            </div>
        </div>
    );
}

export default function ManagementPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <ManagementContent />
        </Suspense>
    );
}
