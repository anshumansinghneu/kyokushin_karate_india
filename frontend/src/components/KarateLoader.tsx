"use client";

import { motion } from "framer-motion";

export default function KarateLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative w-32 h-32">
                {/* Pulse Effect */}
                <motion.div
                    className="absolute inset-0 bg-red-600/20 rounded-full blur-xl"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Fighting Image with Shake/Impact Effect */}
                <motion.div
                    className="relative z-10 w-full h-full"
                    animate={{
                        x: [-2, 2, -2, 0],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 0.2,
                        repeat: Infinity,
                        repeatDelay: 0.5, // Pause between "clashes"
                    }}
                >
                    {/* Invert colors to make it white on black if needed, or just use as is depending on the image */}
                    <img
                        src="/loader-fight.png"
                        alt="Loading..."
                        className="w-full h-full object-contain invert"
                    />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="flex flex-col items-center gap-1"
            >
                <span className="text-2xl font-black tracking-[0.2em] text-white">
                    OSU
                </span>
                <div className="h-1 w-12 bg-red-600 rounded-full" />
            </motion.div>
        </div>
    );
}
