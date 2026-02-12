"use client";

import { motion } from "framer-motion";

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent";

export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`rounded-2xl border border-white/5 bg-zinc-900/50 overflow-hidden ${className}`}>
            <div className={`h-48 bg-zinc-800/50 ${shimmer}`} />
            <div className="p-5 space-y-3">
                <div className={`h-5 w-3/4 rounded-lg bg-zinc-800/50 ${shimmer}`} />
                <div className={`h-4 w-1/2 rounded-lg bg-zinc-800/30 ${shimmer}`} />
                <div className="flex gap-2 mt-4">
                    <div className={`h-8 w-20 rounded-full bg-zinc-800/30 ${shimmer}`} />
                    <div className={`h-8 w-16 rounded-full bg-zinc-800/30 ${shimmer}`} />
                </div>
            </div>
        </div>
    );
}

export function SkeletonEventCard() {
    return (
        <div className={`h-[300px] rounded-2xl border border-white/5 bg-zinc-900/50 overflow-hidden ${shimmer}`}>
            <div className="p-8 flex flex-col justify-between h-full">
                <div className="flex justify-between">
                    <div className={`h-6 w-24 rounded-full bg-zinc-800/50 ${shimmer}`} />
                    <div className="flex flex-col items-end gap-1">
                        <div className={`h-8 w-10 rounded bg-zinc-800/50 ${shimmer}`} />
                        <div className={`h-4 w-8 rounded bg-zinc-800/30 ${shimmer}`} />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className={`h-8 w-3/4 rounded-lg bg-zinc-800/50 ${shimmer}`} />
                    <div className={`h-4 w-1/2 rounded-lg bg-zinc-800/30 ${shimmer}`} />
                    <div className="flex justify-between items-center mt-4">
                        <div className={`h-4 w-20 rounded bg-zinc-800/30 ${shimmer}`} />
                        <div className={`h-10 w-32 rounded-full bg-zinc-800/30 ${shimmer}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonGrid({ count = 6, variant = "card" }: { count?: number; variant?: "card" | "event" }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`grid gap-6 ${variant === "event" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
        >
            {Array.from({ length: count }).map((_, i) => (
                variant === "event" ? <SkeletonEventCard key={i} /> : <SkeletonCard key={i} />
            ))}
        </motion.div>
    );
}

export default SkeletonCard;
