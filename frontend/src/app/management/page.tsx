"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import { Loader2, Shield } from "lucide-react";

function ManagementContent() {
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'overview';

    useEffect(() => {
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
            <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center animate-pulse">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -inset-4 bg-red-500/20 rounded-3xl blur-xl animate-pulse" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    <span className="text-sm font-medium text-gray-500">Loading management console...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-900/[0.07] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/[0.05] rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
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
            <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center animate-pulse">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    <span className="text-sm font-medium text-gray-500">Loading...</span>
                </div>
            </div>
        }>
            <ManagementContent />
        </Suspense>
    );
}
