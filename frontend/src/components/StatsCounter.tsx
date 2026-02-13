"use client";

import { motion, useInView, animate, motionValue } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Users, MapPin, Trophy, Calendar } from "lucide-react";
import KankuMark from "./KankuMark";

function AnimatedCounter({ target, suffix = "+", duration = 2 }: { target: number; suffix?: string; duration?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const mv = motionValue(0);
        const unsub = mv.on("change", (v) => setDisplay(Math.round(v)));
        animate(mv, target, { duration, ease: "easeOut" });
        return unsub;
    }, [inView, target, duration]);

    return <span ref={ref}>{display}{suffix}</span>;
}

const stats = [
    { icon: Users, label: "Active Students", value: 500, suffix: "+" },
    { icon: MapPin, label: "Dojos Nationwide", value: 15, suffix: "+" },
    { icon: Trophy, label: "Tournaments Held", value: 25, suffix: "+" },
    { icon: Calendar, label: "Cities Represented", value: 10, suffix: "+" },
];

export default function StatsCounter() {
    return (
        <section className="relative py-16 md:py-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/10 to-black" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                <KankuMark className="w-64 h-64 text-white opacity-[0.02]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
                >
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="text-center group"
                        >
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 group-hover:scale-110 transition-all duration-300">
                                <stat.icon className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">
                                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                            </p>
                            <p className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-bold">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
