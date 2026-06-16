"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Mail, ChevronRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getRememberedEmail } from "@/lib/tokenStorage";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const { login, isLoading, error } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        useAuthStore.setState({ error: null });
        const remembered = getRememberedEmail();
        if (remembered) setEmail(remembered);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password }, rememberMe);
            router.push("/dashboard");
        } catch (err) {
            // Error managed by the store
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-[#050507] text-white font-sans selection:bg-red-500/30">
            {/* Split Screen Container */}
            <div className="w-full flex h-screen">
                
                {/* ── Left Side: The Visual Brand ─────────────── */}
                <div className="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden">
                    {/* Background Image / Effects */}
                    <div className="absolute inset-0 z-0">
                        {/* Authentic Kyokushin Kanji watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-black text-white/5 select-none pointer-events-none mix-blend-overlay">
                            極真
                        </div>
                        <img 
                            src="/dojo-bg.png" 
                            alt="Kyokushin Dojo" 
                            className="w-full h-full object-cover filter grayscale contrast-125 opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/95 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-red-900/20 mix-blend-multiply" />
                        {/* Gradient fade to the right edge to blend with the form side */}
                        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#050507] to-transparent z-10" />
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                    </div>

                    <div className="relative z-20 p-12 h-full flex flex-col justify-between">
                        {/* Back Button & Logo */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex justify-between items-center"
                        >
                            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Return Home
                            </Link>

                            <div className="flex items-center gap-3">
                                <img src="/kkfi-logo.png" alt="Kyokushin Karate India" className="w-12 h-12 object-contain" />
                                <span className="font-black tracking-tighter text-xl border-l border-white/10 pl-3">O S U !</span>
                            </div>
                        </motion.div>

                        {/* Title Context */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="max-w-xl"
                        >
                            <h1 className="text-5xl xl:text-7xl font-black leading-[0.9] tracking-tighter mb-6 text-white drop-shadow-2xl uppercase">
                                THE ULTIMATE<br/>
                                <span className="text-red-600">TRUTH.</span>
                            </h1>
                            <p className="text-base text-zinc-400 font-medium leading-relaxed max-w-md border-l-2 border-red-600 pl-4">
                                Enter your credentials to manage your dojo, review events, and continue your journey in Kyokushin Karate.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* ── Right Side: The Form ─────────────── */}
                <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 relative z-20 bg-[#050507]">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none z-0 mix-blend-overlay" />
                    
                    {/* Mobile Only Header */}
                    <div className="lg:hidden absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                        <Link href="/" className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-zinc-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <img src="/kkfi-logo.png" alt="KKFI" className="w-8 h-8 object-contain" />
                            <span className="font-black tracking-tighter uppercase">O S U !</span>
                        </div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-md"
                    >
                        {/* The Premium Floating Glass Card */}
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                            
                            {/* Subtle internal gradient glow */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/20 blur-[100px] rounded-full pointer-events-none" />

                            <div className="mb-10 text-center relative z-10">
                                <h2 className="text-3xl font-black text-white mb-2">Sign In</h2>
                                <p className="text-sm font-medium text-zinc-400">Access your dashboard</p>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: "auto" }}
                                        exit={{ opacity: 0, y: -20, height: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-red-400 leading-relaxed">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                {/* Email Field */}
                                <div className="space-y-1.5 group">
                                    <label htmlFor="login-email" className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1 group-focus-within:text-white transition-colors">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="osu@kyokushin.in"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:bg-white/10 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-1.5 group">
                                    <div className="flex justify-between items-end pl-1 mb-1.5">
                                        <label htmlFor="login-password" className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest group-focus-within:text-white transition-colors">
                                            Password
                                        </label>
                                        <Link href="/forgot-password" className="text-[11px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                                        <Input
                                            id="login-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:bg-white/10 transition-all font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-[12px] font-medium text-zinc-400 select-none cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-white/20 bg-transparent accent-red-600"
                                    />
                                    Remember me
                                </label>

                                <Button
                                    className="w-full h-14 mt-4 text-base font-bold bg-white text-black hover:bg-zinc-200 rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Authenticating...
                                        </span>
                                    ) : (
                                        <>
                                            Access Portal <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Registration Prompt */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-zinc-500 font-medium">
                                Don't have an account yet?{" "}
                                <Link href="/register" className="text-white font-bold hover:text-red-400 transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-0 outline-none hover:after:scale-x-100 after:origin-left after:transition-transform">
                                    Create one now
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
