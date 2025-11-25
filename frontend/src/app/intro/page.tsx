"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

export default function IntroPage() {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        // Sequence controller
        const timer1 = setTimeout(() => setPhase(1), 1000); // Pulse start
        const timer2 = setTimeout(() => setPhase(2), 2500); // Tricolor burst
        const timer3 = setTimeout(() => setPhase(3), 4000); // Kanku reveal
        const timer4 = setTimeout(() => setPhase(4), 5500); // Text slam
        const timer5 = setTimeout(() => setPhase(5), 7000); // Button reveal

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative selection:bg-red-600 selection:text-white">

            {/* Ambient Background - Deep Cinematic Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none" />

            {/* Tricolor Energy Beams */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase >= 2 ? 0.4 : 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 pointer-events-none"
            >
                {/* Saffron Beam */}
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-orange-500/0 via-orange-500/50 to-orange-500/0 blur-xl transform -skew-x-12" />
                {/* White Beam */}
                <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-white/0 via-white/30 to-white/0 blur-xl transform -skew-x-12" />
                {/* Green Beam */}
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-green-500/0 via-green-500/50 to-green-500/0 blur-xl transform -skew-x-12" />
            </motion.div>

            {/* Central Composition */}
            <div className="relative z-10 flex flex-col items-center">

                {/* The Kanku Symbol - CSS Constructed for perfect scaling */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -90 }}
                    animate={{
                        scale: phase >= 3 ? 1 : 0,
                        opacity: phase >= 3 ? 1 : 0,
                        rotate: phase >= 3 ? 0 : -90
                    }}
                    transition={{
                        duration: 1.5,
                        ease: [0.16, 1, 0.3, 1], // Apple-style ease
                        type: "spring",
                        bounce: 0.3
                    }}
                    className="relative w-48 h-48 md:w-64 md:h-64 mb-12"
                >
                    {/* Kanku Circle (The Sun) */}
                    <div className="absolute inset-0 rounded-full border-4 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] bg-black/50 backdrop-blur-sm" />

                    {/* Kanku Center (The Void) */}
                    <div className="absolute inset-[35%] rounded-full bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)]" />

                    {/* Kanku Fingers (The Peaks) - Top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[35%] bg-red-600 origin-bottom" />
                    {/* Bottom */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[35%] bg-red-600 origin-top" />
                    {/* Left (Rotated) */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 h-4 w-[35%] bg-red-600 origin-right" />
                    {/* Right (Rotated) */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 h-4 w-[35%] bg-red-600 origin-left" />

                    {/* Diagonal Rays (Thin lines for artistic flair) */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-red-600/20 rounded-full"
                    />
                </motion.div>

                {/* Typography Lockup */}
                <div className="text-center space-y-2">
                    <div className="overflow-hidden">
                        <motion.h1
                            initial={{ y: 100 }}
                            animate={{ y: phase >= 4 ? 0 : 100 }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-none mix-blend-difference"
                        >
                            KYOKUSHIN
                        </motion.h1>
                    </div>

                    <div className="overflow-hidden">
                        <motion.h2
                            initial={{ y: 100 }}
                            animate={{ y: phase >= 4 ? 0 : 100 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "circOut" }}
                            className="text-4xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-white to-green-500 leading-none"
                        >
                            INDIA
                        </motion.h2>
                    </div>
                </div>

                {/* Subtitle / Motto */}
                <motion.p
                    initial={{ opacity: 0, letterSpacing: "0em" }}
                    animate={{
                        opacity: phase >= 4 ? 1 : 0,
                        letterSpacing: phase >= 4 ? "0.5em" : "0em"
                    }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="mt-8 text-xs md:text-sm font-bold text-gray-400 uppercase"
                >
                    The Ultimate Truth
                </motion.p>

                {/* Enter Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: phase >= 5 ? 1 : 0,
                        y: phase >= 5 ? 0 : 20
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-16"
                >
                    <Link href="/">
                        <button className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105">
                            <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-red-600/50 transition-colors" />
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                            <span className="relative flex items-center gap-3 text-white font-medium tracking-widest text-sm group-hover:text-red-500 transition-colors">
                                ENTER THE DOJO
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </Link>
                </motion.div>

            </div>

            {/* Cinematic Grain Overlay */}
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none mix-blend-overlay" />

        </div>
    );
}
