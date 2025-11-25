"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LowKickPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white">

            {/* HERO SECTION */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
                {/* Source Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="/low-kick-source-bg.jpg"
                        alt="Background"
                        className="w-full h-full object-cover opacity-90"
                    />
                    {/* Vignette to ensure center blackness and text contrast */}
                    <div className="absolute inset-0 bg-radial-gradient-center from-transparent via-black/10 to-black/60 pointer-events-none" />
                </div>

                {/* Noise Overlay - Kept for cinematic texture */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

                {/* Logo - Top Left */}
                <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
                    <img
                        src="/low-kick-logo-v2.png"
                        alt="Low Kick Championship"
                        className="w-24 md:w-40 h-auto object-contain drop-shadow-2xl"
                    />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">

                    {/* Main Title Lockup */}
                    <div className="flex flex-col items-center">
                        <motion.h1
                            initial={{ y: 20, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Apple-style ease
                            className="text-7xl md:text-[10rem] font-black tracking-tighter text-white drop-shadow-2xl leading-[0.85] select-none"
                        >
                            LOW KICK
                        </motion.h1>

                        <motion.h2
                            initial={{ y: -20, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-6xl md:text-[8rem] font-black tracking-tighter text-red-600 drop-shadow-2xl leading-[0.85] select-none"
                        >
                            CHAMPIONSHIP
                        </motion.h2>
                    </div>

                    {/* India & Flag - Cinematic Reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                        className="flex items-center justify-center gap-4 mt-8 md:mt-12"
                    >
                        {/* INDIA Text with Wide Tracking */}
                        <motion.span
                            initial={{ letterSpacing: "0em" }}
                            animate={{ letterSpacing: "0.15em" }} // Cinematic widening
                            transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
                            className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg uppercase"
                        >
                            INDIA
                        </motion.span>

                        {/* Flag with Slow Floating Effect */}
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 1.2, delay: 0.8, type: "spring", bounce: 0.4 }}
                            className="relative"
                        >
                            <motion.img
                                animate={{ y: [-3, 3, -3] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                src="/india-flag.png"
                                alt="India Flag"
                                className="h-8 md:h-12 w-auto object-contain drop-shadow-2xl"
                            />
                        </motion.div>
                    </motion.div>

                </div>
            </section>

            {/* FOUNDER SECTION */}
            <section className="py-32 bg-zinc-950 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* Image */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative border border-white/10">
                                <img
                                    src="/founder-abraham.jpg"
                                    alt="Abraham Gallart"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                <div className="absolute bottom-8 left-8">
                                    <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 inline-block mb-2 uppercase tracking-wider">Founder</div>
                                    <h3 className="text-3xl font-black text-white">ABRAHAM GALLART</h3>
                                </div>
                            </div>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                                    THE <span className="text-red-600">VISIONARY</span>
                                </h2>
                                <div className="w-20 h-1 bg-red-600" />
                            </div>

                            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                                <p>
                                    <span className="text-white font-bold">Abraham Gallart</span>, born in Valencia in 1974, is passionate about martial arts and combat sports. Throughout his life, he has practiced a wide variety of styles, ranging from Taekwondo, Jiu-Jitsu, Kickboxing, and MMA to Kyokushin Karate.
                                </p>
                                <p>
                                    An entrepreneur at heart, he has undertaken projects such as creating a successful surf brand and organizing various combat sports events.
                                </p>
                                <div className="pl-6 border-l-2 border-red-600/50 italic text-gray-400">
                                    "Leading a small but highly professional team, Abraham brings us a new, fresh, and original event like few others."
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* SPLIT NAVIGATION SECTION */}
            <section className="py-24 bg-zinc-950 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">

                        {/* REGISTRATION CARD (BLUE) */}
                        <Link href="/register" className="group relative h-[500px] overflow-hidden cursor-pointer">
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img
                                    src="/registration-bg.jpg"
                                    alt="Registration"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Blue Overlay */}
                                <div className="absolute inset-0 bg-blue-900/60 mix-blend-multiply transition-opacity duration-500 group-hover:bg-blue-900/40" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                            </div>

                            {/* Open Frame Border */}
                            <div className="absolute inset-8 border-2 border-white/80 border-b-0 transition-all duration-500 group-hover:inset-6">
                                <div className="absolute bottom-0 left-0 w-1/4 h-0.5 bg-white/80" />
                                <div className="absolute bottom-0 right-0 w-3/5 h-0.5 bg-white/80" />
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-12 left-12 z-10">
                                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-2 drop-shadow-lg">
                                    REGISTRATION
                                </h2>
                                <div className="h-1 w-24 bg-blue-600 transform origin-left transition-transform duration-500 group-hover:scale-x-150" />
                            </div>
                        </Link>

                        {/* REGULATION CARD (RED) */}
                        <div className="group relative h-[500px] overflow-hidden cursor-pointer">
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img
                                    src="/regulation-bg.jpg"
                                    alt="Regulation"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Red Overlay */}
                                <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply transition-opacity duration-500 group-hover:bg-red-900/40" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                            </div>

                            {/* Open Frame Border */}
                            <div className="absolute inset-8 border-2 border-white/80 border-b-0 transition-all duration-500 group-hover:inset-6">
                                <div className="absolute bottom-0 left-0 w-1/4 h-0.5 bg-white/80" />
                                <div className="absolute bottom-0 right-0 w-3/5 h-0.5 bg-white/80" />
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-12 left-12 z-10">
                                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-2 drop-shadow-lg">
                                    REGULATION
                                </h2>
                                <div className="h-1 w-24 bg-red-600 transform origin-left transition-transform duration-500 group-hover:scale-x-150" />
                            </div>
                        </div>

                    </div>
                </div>
            </section>



        </div>
    );
}
