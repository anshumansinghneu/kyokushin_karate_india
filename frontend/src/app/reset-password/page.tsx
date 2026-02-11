"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Suspense } from "react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Validation states
    const hasMinLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new password reset link.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!hasMinLength || !hasSpecialChar) {
            setError("Password must be at least 8 characters with a special character.");
            return;
        }
        if (!passwordsMatch) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post("/auth/reset-password", { token, password });
            const { token: jwt } = res.data;
            if (jwt) {
                localStorage.setItem("token", jwt);
            }
            setSuccess(true);
            // Auto-redirect to dashboard after 2s
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Reset failed. The link may have expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black font-sans selection:bg-red-500/30">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black z-0" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] z-0 mix-blend-overlay pointer-events-none" />

            <Link href="/login" className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 transition-all group text-sm font-medium tracking-wide z-20">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                BACK TO LOGIN
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md px-8 relative z-10"
            >
                {success ? (
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                        >
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h3 className="text-3xl font-bold text-white mb-3">Password Reset!</h3>
                        <p className="text-gray-400 mb-6">
                            Your password has been updated successfully. Redirecting to dashboard...
                        </p>
                        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                                <Lock className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Set New Password</h3>
                            <p className="text-gray-400">Choose a strong password for your account.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 rounded-r-lg text-sm font-medium flex items-center gap-3"
                            >
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-red-500 transition-colors">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                {password.length > 0 && (
                                    <div className="space-y-1 mt-2 ml-1">
                                        <div className={`flex items-center gap-2 text-xs ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-gray-600'}`} />
                                            At least 8 characters
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${hasSpecialChar ? 'text-green-400' : 'text-gray-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${hasSpecialChar ? 'bg-green-400' : 'bg-gray-600'}`} />
                                            Contains a special character
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-red-500 transition-colors">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 transition-all ${confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500/50' : ''}`}
                                    />
                                </div>
                                {confirmPassword.length > 0 && !passwordsMatch && (
                                    <p className="text-red-400 text-xs ml-1">Passwords do not match</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all duration-300"
                                disabled={isLoading || !token}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Resetting...
                                    </span>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
