"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Mail, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
            router.push("/dashboard");
        } catch (err) {
            // Error handled by store
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-black font-sans selection:bg-red-500/30">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black z-0" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] z-0 mix-blend-overlay pointer-events-none" />

            {/* Left Side - Hero/Brand */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/dojo-bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay grayscale" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/0 to-black" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-20 text-center"
                >
                    <h1 className="text-[12rem] leading-none font-black text-transparent stroke-text opacity-10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-sm">
                        OSU
                    </h1>
                    <div className="relative">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            <h2 className="text-8xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">
                                KYOKUSHIN
                            </h2>
                        </motion.div>
                        <motion.p
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="text-3xl text-red-500 font-bold tracking-[0.8em] uppercase ml-2 pl-1 border-l-4 border-red-600"
                        >
                            Karate India
                        </motion.p>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 relative z-20">
                <Link href="/" className="absolute top-8 left-8 lg:left-12 text-gray-500 hover:text-white flex items-center gap-2 transition-all group text-sm font-medium tracking-wide">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    RETURN HOME
                </Link>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10">
                        <h3 className="text-4xl font-bold text-white mb-3">Welcome Back</h3>
                        <p className="text-gray-400 text-lg">Sign in to manage your dojo and events.</p>
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
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-red-500 transition-colors">Email Address</label>
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

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-red-500 transition-colors">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2">
                            <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-white transition-colors select-none">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer h-4 w-4 rounded border-white/20 bg-white/5 text-red-600 focus:ring-red-500/20 focus:ring-offset-0" />
                                </div>
                                Remember me
                            </label>
                            <Link href="/forgot-password" className="text-red-500 hover:text-red-400 font-medium transition-colors">Forgot password?</Link>
                        </div>

                        <Button
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all duration-300 flex items-center justify-center gap-2 group"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                <>
                                    Sign In <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/5 text-center">
                        <p className="text-gray-500">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-white font-bold hover:text-red-500 transition-colors inline-flex items-center gap-1">
                                Register Now
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
