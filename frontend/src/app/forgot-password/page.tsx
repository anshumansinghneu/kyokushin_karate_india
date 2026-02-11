"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Send, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
                {sent ? (
                    /* Success State */
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                        >
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h3 className="text-3xl font-bold text-white mb-3">Check Your Email</h3>
                        <p className="text-gray-400 mb-2">
                            We've sent a password reset link to
                        </p>
                        <p className="text-white font-mono text-sm bg-white/5 px-4 py-2 rounded-lg inline-block mb-6">
                            {email}
                        </p>
                        <p className="text-gray-500 text-sm mb-8">
                            The link will expire in 1 hour. If you don't see the email, check your spam folder.
                        </p>
                        <Link href="/login">
                            <Button className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 px-8">
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    /* Form State */
                    <>
                        <div className="mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                                <Mail className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Forgot Password?</h3>
                            <p className="text-gray-400">No worries. Enter your email and we'll send you a reset link.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 rounded-r-lg text-sm font-medium flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-red-500 transition-colors">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="osu@kyokushin.in"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all duration-300 flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" /> Send Reset Link
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-gray-500 text-sm mt-8">
                            Remember your password?{" "}
                            <Link href="/login" className="text-white font-bold hover:text-red-500 transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
