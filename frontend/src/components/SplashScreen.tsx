"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [phase, setPhase] = useState<"FIGHT" | "KICK" | "DONE">("FIGHT");
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        // Frame Animation Loop
        const frameInterval = setInterval(() => {
            setFrame((prev) => (prev === 0 ? 1 : 0));
        }, 150); // Fast toggle for GIF feel

        // Phase 1: Fighting Stance (0s - 2.5s)
        const timer1 = setTimeout(() => {
            setPhase("KICK");
        }, 2500);

        // Phase 2: Kick Impact & Zoom (2.5s - 3.5s)
        const timer2 = setTimeout(() => {
            setPhase("DONE");
            setTimeout(onFinish, 500); // Wait for exit animation
        }, 3500);

        return () => {
            clearInterval(frameInterval);
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onFinish]);

    return (
        <AnimatePresence>
            {phase !== "DONE" && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">

                        {/* Phase 1: Fighting Stance (Animated) */}
                        {phase === "FIGHT" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                                transition={{ duration: 0.5 }}
                                className="relative w-64 h-64 md:w-96 md:h-96"
                            >
                                <img
                                    src={frame === 0 ? "/loader-fight.png" : "/loader-fight-2.png"}
                                    alt="Fighting Stance"
                                    className="w-full h-full object-contain invert drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                                />
                                <motion.div
                                    className="absolute inset-0 bg-red-600/20 rounded-full blur-3xl -z-10"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                        )}

                        {/* Phase 2: Kick Impact */}
                        {phase === "KICK" && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: [0.5, 1, 20], opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 0.8,
                                    times: [0, 0.1, 1],
                                    ease: "easeInOut"
                                }}
                                className="relative w-64 h-64 md:w-96 md:h-96 z-20"
                            >
                                <img
                                    src="/loader-kick.png"
                                    alt="Kick Impact"
                                    className="w-full h-full object-contain invert"
                                />
                                {/* Impact Flash */}
                                <motion.div
                                    className="absolute inset-0 bg-white mix-blend-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.1, delay: 0.05 }}
                                />
                            </motion.div>
                        )}

                        {/* Text Overlay (Always visible until done) */}
                        <motion.div
                            className="absolute bottom-10 md:bottom-20 flex flex-col items-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <span className="text-4xl md:text-6xl font-black tracking-tighter text-white italic">
                                OSU!
                            </span>
                            <div className="h-1 w-24 bg-red-600 mt-2 rounded-full" />
                        </motion.div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
