"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
                {/* Placeholder for actual hero image - using a dark gradient for now if image missing */}
                <div className="w-full h-full bg-[url('/hero-bg.png')] bg-cover bg-center opacity-50" />
                {/* Fallback gradient if image fails or for effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface via-black to-black -z-10" />
            </div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-sm md:text-base">
                        The Strongest Karate
                    </h2>
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mb-6 leading-none">
                        ULTIMATE <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">
                            TRUTH
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
                        Join the official platform of Kyokushin Karate Foundation of India.
                        Train hard, compete with honor, and forge your spirit.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/register">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-primary text-white font-bold text-lg uppercase tracking-wider clip-path-slant hover:bg-primary-light transition-colors flex items-center gap-2"
                            >
                                Join Now <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </Link>
                        <Link href="/events">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold text-lg uppercase tracking-wider hover:bg-white/10 transition-colors backdrop-blur-sm"
                            >
                                View Events
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-white rounded-full" />
                </div>
            </motion.div>
        </section>
    );
}
