"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import {
    Heart, Users, GraduationCap, Shield, Target, Sparkles,
    HandHeart, School, Dumbbell, Globe, ArrowRight, Mail,
    Phone, Building2, CheckCircle2, TrendingUp, Star, Quote,
    Zap, Award, TreePine, BookOpen, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Animated counter ─────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, target, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Floating particles ───────────────────────────────────────────── */
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/20 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 1.2, 0.5],
                    }}
                    transition={{
                        duration: 4 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

/* ── Tilt card for programs ───────────────────────────────────────── */
function ProgramCard({ program, index }: { program: typeof csrPrograms[0]; index: number }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
    const rotateX = useTransform(mouseY, [-100, 100], [4, -4]);
    const rotateY = useTransform(mouseX, [-100, 100], [-4, 4]);

    const Icon = program.icon;

    function onMouseMove(e: React.MouseEvent) {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - left - width / 2);
        y.set(e.clientY - top - height / 2);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            className={`group relative bg-white/5 border ${program.borderColor} rounded-xl p-7 hover:bg-white/10 transition-all duration-500 overflow-hidden cursor-default`}
        >
            {/* Hover glow */}
            <div
                className={`absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10`}
                style={{ background: `radial-gradient(400px circle, ${program.glowColor}, transparent 70%)` }}
            />

            {/* Number watermark */}
            <span className="absolute -top-4 -right-2 text-[7rem] font-black text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none leading-none">
                {String(index + 1).padStart(2, "0")}
            </span>

            <div className="relative z-10">
                <div className={`inline-flex p-3.5 rounded-2xl ${program.bgColor} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${program.color}`} />
                </div>
                <h3 className="text-xl font-black text-white mb-3 tracking-tight">{program.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{program.description}</p>

                {/* Impact bar */}
                <div className="relative">
                    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${program.bgColor} border ${program.borderColor}`}>
                        <div className={`w-2 h-2 rounded-full ${program.dotColor} animate-pulse`} />
                        <span className={`text-xs font-black uppercase tracking-wider ${program.color}`}>
                            {program.impact}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Data ─────────────────────────────────────────────────────────── */
const csrPrograms = [
    {
        icon: School,
        title: "School Outreach Program",
        description: "Free self-defense & discipline workshops in government schools, teaching confidence and resilience to every child across India.",
        impact: "500+ Students Reached",
        color: "text-white",
        bgColor: "bg-white/10",
        borderColor: "border-white/10",
        glowColor: "rgba(255,0,0,0.12)",
        dotColor: "bg-[#FF0000]",
    },
    {
        icon: Heart,
        title: "Free Training for Underprivileged",
        description: "Full scholarships — training, gi, and gear — for underprivileged youth who show the fire of a true karateka.",
        impact: "50+ Scholarships Given",
        color: "text-white",
        bgColor: "bg-white/10",
        borderColor: "border-white/10",
        glowColor: "rgba(255,0,0,0.12)",
        dotColor: "bg-[#FF0000]",
    },
    {
        icon: Users,
        title: "Women's Self-Defense Initiative",
        description: "Dedicated camps for women and girls in rural and semi-urban areas — building unshakable confidence one punch at a time.",
        impact: "30+ Camps Conducted",
        color: "text-white",
        bgColor: "bg-white/10",
        borderColor: "border-white/10",
        glowColor: "rgba(255,0,0,0.12)",
        dotColor: "bg-[#FF0000]",
    },
    {
        icon: Dumbbell,
        title: "Community Health & Fitness",
        description: "Free fitness sessions and health awareness camps promoting physical and mental well-being through martial arts discipline.",
        impact: "1000+ Participants",
        color: "text-white",
        bgColor: "bg-white/10",
        borderColor: "border-white/10",
        glowColor: "rgba(255,0,0,0.12)",
        dotColor: "bg-[#FF0000]",
    },
    {
        icon: GraduationCap,
        title: "Youth Empowerment Program",
        description: "Anti-bullying workshops and character development through Kyokushin philosophy — respect, perseverance, integrity.",
        impact: "20+ Schools Covered",
        color: "text-white",
        bgColor: "bg-white/10",
        borderColor: "border-white/10",
        glowColor: "rgba(255,0,0,0.12)",
        dotColor: "bg-[#FF0000]",
    },
    {
        icon: Globe,
        title: "Rural Karate Development",
        description: "Building karate training centers where none exist — nurturing champions from India's grassroots.",
        impact: "10+ Rural Centers",
        color: "text-white",
        bgColor: "bg-white/10",
        borderColor: "border-white/10",
        glowColor: "rgba(255,0,0,0.12)",
        dotColor: "bg-[#FF0000]",
    },
];

const impactStats = [
    { value: 1500, suffix: "+", label: "Lives Impacted", icon: Heart },
    { value: 30, suffix: "+", label: "Programs Conducted", icon: Zap },
    { value: 50, suffix: "+", label: "Scholarships Given", icon: Award },
    { value: 15, suffix: "+", label: "Partner Orgs", icon: Building2 },
];

const timeline = [
    { year: "2019", title: "The Seed", description: "First free training session for 10 underprivileged children in a small Delhi dojo.", icon: TreePine },
    { year: "2020", title: "The Storm", description: "Free online classes during COVID lockdowns — 200+ students stayed active when gyms closed.", icon: Zap },
    { year: "2022", title: "The Expansion", description: "School outreach launched across UP, Delhi NCR, and MP. First corporate CSR partnership formed.", icon: Globe },
    { year: "2024", title: "The Movement", description: "Women's self-defense camps go rural. 10 new training centers established in underserved areas.", icon: Users },
    { year: "2026", title: "The Vision", description: "1500+ lives changed and counting. The goal: a karate dojo within reach of every Indian child.", icon: Star },
];

const testimonials = [
    {
        quote: "Karate gave me something nobody could take away — belief in myself. I was nobody, now I'm a green belt.",
        name: "Priya Kumari",
        role: "Scholarship Student, Age 14",
        location: "Lucknow",
    },
    {
        quote: "After the self-defense camp, our girls walk with their heads held high. That's the real black belt.",
        name: "Meera Devi",
        role: "School Principal",
        location: "Rural Kanpur",
    },
    {
        quote: "The discipline my son learned here changed our family. He teaches his younger siblings what he learns every day.",
        name: "Rajesh Patel",
        role: "Parent",
        location: "Sikandrabad",
    },
];

const processSteps = [
    { step: "01", title: "Connect", description: "Reach out to our CSR team", icon: Phone },
    { step: "02", title: "Align", description: "We match programs to your CSR goals", icon: Target },
    { step: "03", title: "Impact", description: "Your contribution creates change", icon: Lightbulb },
    { step: "04", title: "Report", description: "Receive detailed impact reports", icon: BookOpen },
];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function CSRPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-red-500/30">
            {/* Background layers */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(139,0,0,0.10),_transparent_60%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <FloatingParticles />

            {/* ── HERO ──────────────────────────────────────────────── */}
            <div ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    {/* Floating badge */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF4D4D] text-sm font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
                    >
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                            <HandHeart className="w-4 h-4" />
                        </motion.div>
                        Corporate Social Responsibility
                    </motion.div>

                    {/* Big heading with staggered words */}
                    <div className="mb-8">
                        <motion.h1
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-black tracking-tighter leading-[0.9]"
                        >
                            {["STRENGTH", "BEYOND", "THE", "DOJO"].map((word, i) => (
                                <motion.span
                                    key={word}
                                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{ delay: 0.4 + i * 0.12, duration: 0.7 }}
                                    className={`inline-block mr-4 md:mr-6 ${
                                        i === 0 ? "text-white" :
                                        i === 3 ? "text-[#FF0000]" :
                                        "text-white"
                                    }`}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </motion.h1>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10"
                    >
                        At <span className="text-white font-semibold">KKFI</span>, we channel the warrior spirit
                        into community upliftment — empowering youth, defending the vulnerable,
                        and building a <span className="text-[#FF4D4D] font-semibold">stronger India</span>, one dojo at a time.
                    </motion.p>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="flex flex-col items-center gap-2 text-gray-400"
                    >
                        <span className="text-xs uppercase tracking-[0.3em] font-bold">Scroll to explore</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-5 h-8 rounded-full border-2 border-gray-400 flex items-start justify-center pt-1.5"
                        >
                            <div className="w-1 h-1.5 bg-[#FF4D4D] rounded-full" />
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Gradient fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent z-10" />
            </div>

            {/* ── IMPACT STATS (animated counters) ──────────────────── */}
            <section className="relative z-10 -mt-20 mb-32">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {impactStats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                                    className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 text-center overflow-hidden hover:border-[#FF0000]/30 transition-all duration-500"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#FF0000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Icon className="w-5 h-5 text-[#FF0000]/40 mx-auto mb-3 group-hover:text-[#FF4D4D] transition-colors" />
                                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-[#FF4D4D] mb-1 tabular-nums">
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                    </p>
                                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">{stat.label}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── MISSION ───────────────────────────────────────────── */}
            <section className="relative z-10 mb-32 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative bg-white/5 border border-white/10 rounded-xl p-8 md:p-14 overflow-hidden"
                    >
                        {/* Decorative rings */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF0000]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                    className="p-4 rounded-2xl bg-gradient-to-br from-[#FF0000]/20 to-[#FF0000]/5 border border-[#FF0000]/20"
                                >
                                    <Target className="w-7 h-7 text-[#FF4D4D]" />
                                </motion.div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Our Mission</h2>
                                    <p className="text-sm text-[#FF4D4D]/70 font-bold uppercase tracking-wider">Why we fight beyond the ring</p>
                                </div>
                            </div>

                            <p className="text-gray-400 leading-relaxed text-base md:text-lg mb-8 max-w-3xl">
                                Kyokushin means <span className="text-white font-bold italic">&quot;the ultimate truth&quot;</span>.
                                Our truth? That martial arts is the most powerful tool for social change.
                                Every punch teaches <span className="text-[#FF4D4D] font-semibold">discipline</span>,
                                every kata builds <span className="text-[#FF4D4D] font-semibold">character</span>,
                                and every belt earned proves that <span className="text-white font-semibold">anyone can rise</span>.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { icon: Shield, text: "Empower youth through martial arts", stat: "500+" },
                                    { icon: TrendingUp, text: "Build healthier communities", stat: "30+" },
                                    { icon: Star, text: "Nurture future champions", stat: "50+" },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="flex items-center gap-4 bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-[#FF0000]/20 transition-colors group"
                                    >
                                        <div className="p-2.5 rounded-xl bg-[#FF0000]/10 group-hover:bg-[#FF0000]/20 transition-colors">
                                            <item.icon className="w-5 h-5 text-[#FF4D4D]" />
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-300 font-semibold block">{item.text}</span>
                                            <span className="text-xs text-[#FF4D4D]/60 font-bold">{item.stat} impacted</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── PROGRAMS ──────────────────────────────────────────── */}
            <section className="relative z-10 mb-32 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-xs font-bold text-[#FF0000]/60 uppercase tracking-[0.3em] block mb-4">What we do</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        OUR{" "}
                        <span className="text-white">
                            PROGRAMS
                        </span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
                        Six initiatives that prove the strongest punch is the one that lifts someone up.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {csrPrograms.map((program, i) => (
                        <ProgramCard key={program.title} program={program} index={i} />
                    ))}
                </div>
            </section>

            {/* ── IMPACT TIMELINE ───────────────────────────────────── */}
            <section className="relative z-10 mb-32 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-xs font-bold text-[#FF0000]/60 uppercase tracking-[0.3em] block mb-4">Our journey</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                        THE{" "}
                        <span className="text-white">
                            TIMELINE
                        </span>
                    </h2>
                </motion.div>

                <div className="max-w-3xl mx-auto relative">
                    {/* Vertical line */}
                    <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#FF0000]/30 to-transparent md:-translate-x-px" />

                    {timeline.map((item, i) => {
                        const Icon = item.icon;
                        const isLeft = i % 2 === 0;
                        return (
                            <motion.div
                                key={item.year}
                                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className={`relative flex items-start gap-6 mb-12 md:mb-16 ${
                                    isLeft ? "md:flex-row" : "md:flex-row-reverse"
                                } flex-row`}
                            >
                                {/* Dot on line */}
                                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FF0000] rounded-full border-4 border-black z-10 mt-2">
                                    <div className="absolute inset-0 bg-[#FF4D4D] rounded-full animate-ping opacity-30" />
                                </div>

                                {/* Content */}
                                <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:text-right md:pr-8" : "md:text-left md:pl-8"}`}>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 mb-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                                        <Icon className="w-3.5 h-3.5 text-[#FF4D4D]" />
                                        <span className="text-[#FF4D4D] text-xs font-black tracking-wider">{item.year}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ── TESTIMONIALS ──────────────────────────────────────── */}
            <section className="relative z-10 mb-32 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-xs font-bold text-[#FF0000]/60 uppercase tracking-[0.3em] block mb-4">Real voices</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                        STORIES OF{" "}
                        <span className="text-white">
                            IMPACT
                        </span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            className="group relative bg-white/5 border border-white/10 rounded-xl p-7 hover:border-[#FF0000]/20 transition-colors duration-500"
                        >
                            <Quote className="w-8 h-8 text-[#FF0000]/20 mb-4 group-hover:text-[#FF0000]/40 transition-colors" />
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-6 italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0000]/30 to-[#FF0000]/10 flex items-center justify-center border border-[#FF0000]/30 text-[#FF4D4D] font-black text-sm">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{t.name}</p>
                                    <p className="text-xs text-gray-400">{t.role} · {t.location}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CSR PARTNERS ──────────────────────────────────────── */}
            <section className="relative z-10 mb-32 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-xs font-bold text-[#FF0000]/60 uppercase tracking-[0.3em] block mb-4">Proudly supported by</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                        OUR{" "}
                        <span className="text-white">
                            PARTNERS
                        </span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {[
                        {
                            name: "Goldiee Group",
                            tagline: "The Epitome of Quality Since 1980",
                            description: "One of India's largest producers of quality spices and food products — powering our community health and nutrition programs.",
                            logo: "https://goldiee.com/wp-content/uploads/2018/10/Logo_.png",
                            website: "https://goldiee.com/",
                            borderColor: "border-white/10",
                            hoverBorder: "hover:border-white/20",
                            accentColor: "text-white",
                            location: "Kanpur, UP",
                        },
                        {
                            name: "Frontier Alloys",
                            tagline: "Trailblazers in Rolling Stock Components",
                            description: "Leading manufacturer serving Indian Railways for 38+ years — supporting our youth empowerment and school outreach programs.",
                            logo: "https://static.wixstatic.com/media/2a0662_67b739277d564fc79ac52eee67e02837~mv2.png",
                            website: "https://www.frontieralloy.com/",
                            borderColor: "border-white/10",
                            hoverBorder: "hover:border-white/20",
                            accentColor: "text-white",
                            location: "Kanpur, UP",
                        },
                        {
                            name: "Shri Gang Industries",
                            tagline: "Excellence in Distillery & Food Products Since 1990",
                            description: "A committed CSR partner fueling our scholarship and rural karate development programs across northern India.",
                            logo: "https://www.shrigangindustries.com/assets/img/logo.png",
                            website: "https://www.shrigangindustries.com/",
                            borderColor: "border-white/10",
                            hoverBorder: "hover:border-white/20",
                            accentColor: "text-white",
                            location: "Sikandrabad, UP",
                        },
                    ].map((partner, i) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12, duration: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            className={`group relative bg-white/5 border ${partner.borderColor} ${partner.hoverBorder} rounded-xl p-7 md:p-8 transition-all duration-500 flex flex-col items-center text-center`}
                        >
                            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-4 mb-5 group-hover:scale-105 transition-transform duration-500">
                                <img
                                    src={partner.logo}
                                    alt={partner.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h3 className="text-xl font-black text-white mb-1">{partner.name}</h3>
                            <p className={`text-xs font-bold ${partner.accentColor} mb-3`}>{partner.tagline}</p>
                            <p className="text-sm text-gray-400 leading-relaxed mb-4">{partner.description}</p>
                            <p className="text-xs text-gray-400 mb-5">{partner.location}</p>
                            <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 ${partner.accentColor} text-sm font-bold hover:opacity-80 transition-opacity mt-auto group/link`}
                            >
                                Visit Website
                                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS (process flow) ───────────────────────── */}
            <section className="relative z-10 mb-32 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-xs font-bold text-[#FF0000]/60 uppercase tracking-[0.3em] block mb-4">Simple & transparent</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                        HOW CSR{" "}
                        <span className="text-white">
                            WORKS
                        </span>
                    </h2>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {processSteps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                    className="relative group"
                                >
                                    {/* Connector line */}
                                    {i < processSteps.length - 1 && (
                                        <div className="hidden lg:block absolute top-10 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-px bg-gradient-to-r from-[#FF0000]/30 to-transparent" />
                                    )}
                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center group-hover:border-[#FF0000]/30 transition-all duration-300">
                                        <div className="text-[2.5rem] font-black text-[#FF0000]/10 group-hover:text-[#FF0000]/20 transition-colors leading-none mb-2">
                                            {step.step}
                                        </div>
                                        <div className="inline-flex p-3 rounded-xl bg-[#FF0000]/10 mb-4 group-hover:scale-110 transition-transform">
                                            <Icon className="w-6 h-6 text-[#FF4D4D]" />
                                        </div>
                                        <h3 className="text-lg font-black text-white mb-1">{step.title}</h3>
                                        <p className="text-xs text-gray-400">{step.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section className="relative z-10 mb-20 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        <div className="relative p-10 md:p-16 text-center">
                            {/* Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,0,0,0.10),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl" />

                            <div className="relative z-10">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="inline-flex p-5 rounded-full bg-[#FF0000]/10 mb-6"
                                >
                                    <Building2 className="w-10 h-10 text-[#FF0000] drop-shadow-[0_0_20px_rgba(255,0,0,0.4)]" />
                                </motion.div>

                                <div className="inline-block px-5 py-2 mb-6 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-full">
                                    <span className="text-[#FF4D4D] text-sm font-black uppercase tracking-wider">We Accept CSR Contributions</span>
                                </div>

                                <h2 className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tighter">
                                    Partner With Us
                                </h2>
                                <p className="text-gray-400 mb-8 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                                    Your CSR contributions can expand our reach, change more lives,
                                    and create lasting social impact. We&apos;re registered and compliant
                                    under the Companies Act.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-10">
                                    {[
                                        { text: "Section 135 Compliant", icon: Shield },
                                        { text: "Tax Benefits Available", icon: Sparkles },
                                        { text: "Impact Reports Provided", icon: BookOpen },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                            <item.icon className="w-4 h-4 text-[#FF4D4D] shrink-0" />
                                            <span className="text-xs text-gray-300 font-bold">{item.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="mailto:kyokushinkarateindia@gmail.com?subject=CSR%20Partnership%20Inquiry">
                                        <Button className="bg-[#FF0000] hover:bg-[#8B0000] text-white font-bold px-10 text-lg rounded-none focus-visible:ring-[#FF0000] focus-visible:ring-offset-black">
                                            <Mail className="w-5 h-5 mr-2" /> Enquire for CSR
                                        </Button>
                                    </a>
                                    <a href="tel:+919876543210">
                                        <Button variant="outline" className="text-white border border-white/20 hover:bg-white/10 font-bold px-10 text-lg rounded-none focus-visible:ring-[#FF0000] focus-visible:ring-offset-black">
                                            <Phone className="w-5 h-5 mr-2" /> Call Us
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer note ───────────────────────────────────────── */}
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="relative z-10 text-center text-xs text-gray-400 max-w-2xl mx-auto pb-12 px-4"
            >
                Kyokushin Karate Federation of India is committed to full transparency.
                All CSR contributions are documented and detailed impact reports are shared with contributing organizations.
            </motion.p>
        </div>
    );
}
