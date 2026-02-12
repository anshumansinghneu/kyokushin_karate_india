"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { ArrowRight, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";

interface HeroProps {
    heroOpacity: any;
    heroScale: any;
    content: any;
}

export default function HeroSectionV2({ heroOpacity, heroScale, content }: HeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Detect touch device and auto-enable effects
    useEffect(() => {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(isTouch);
        if (isTouch) {
            setIsHovered(true); // Always show effects on touch devices
        }
    }, []);

    // Smooth mouse movement for spotlight
    const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 100, damping: 20 });

    // 3D Tilt Values - Intensify on hover
    const rotateX = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [isHovered ? 10 : 5, isHovered ? -10 : -5]);
    const rotateY = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [isHovered ? -10 : -5, isHovered ? 10 : 5]);

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    function onTouchMove(e: TouchEvent) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const { left, top } = (e.currentTarget as HTMLElement).getBoundingClientRect();
            mouseX.set(touch.clientX - left);
            mouseY.set(touch.clientY - top);
        }
    }

    // Parallax Transforms for Text
    const titleX = useTransform(smoothX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [30, -30]);
    const titleY = useTransform(smoothY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [30, -30]);

    return (
        <section
            ref={containerRef}
            className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black cursor-default perspective-2000 gpu-accelerate"
            onMouseMove={onMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => !isTouchDevice && setIsHovered(false)}
            onTouchMove={onTouchMove}
        >
            {/* Background Layers */}
            <motion.div
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="absolute inset-0 z-0 bg-black will-change-transform will-change-opacity"
            >
                {/* Base Dark Layer with Gradient - Pulses Red in Beast Mode */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 z-0 gpu-accelerate"
                    animate={{
                        background: isHovered
                            ? "linear-gradient(to bottom, #1a0505, #000000, #1a0505)"
                            : "linear-gradient(to bottom, #09090b, #000000, #09090b)"
                    }}
                    transition={{ duration: 0.5 }}
                />

                {/* Spotlight Revealed Content */}
                <motion.div
                    className="absolute inset-0 z-10"
                    style={{
                        maskImage: useMotionTemplate`radial-gradient(circle ${isHovered ? "600px" : "500px"} at ${smoothX}px ${smoothY}px, black, transparent)`,
                        WebkitMaskImage: useMotionTemplate`radial-gradient(circle ${isHovered ? "600px" : "500px"} at ${smoothX}px ${smoothY}px, black, transparent)`,
                    }}
                >
                    {content['home_hero_video']?.value ? (
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-60 scale-105"
                        >
                            <source src={content['home_hero_video']?.value} type="video/mp4" />
                        </video>
                    ) : (
                        <motion.img
                            src="/oyama.png"
                            alt="Sosai Mas Oyama"
                            className="w-full h-full object-cover opacity-50 grayscale contrast-125"
                            animate={{ scale: isHovered ? 1.05 : 1.02 }}
                            transition={{ duration: 0.8 }}
                        />
                    )}
                    {/* Red Overlay intensifies on hover */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black via-red-900/20 to-black mix-blend-multiply"
                        animate={{ opacity: isHovered ? 0.8 : 0.6 }}
                        transition={{ duration: 0.3 }}
                    />
                </motion.div>

                {/* Ambient Visibility */}
                <div className="absolute inset-0 z-0 opacity-20">
                    {content['home_hero_video']?.value ? (
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover grayscale"
                        >
                            <source src={content['home_hero_video']?.value} type="video/mp4" />
                        </video>
                    ) : (
                        <Image
                            src="/oyama.png"
                            alt="Sosai Mas Oyama - Founder of Kyokushin Karate"
                            fill
                            className="object-cover grayscale contrast-150"
                            priority
                        />
                    )}
                </div>

                {/* Animated Noise Texture - Faster on hover */}
                <div className={`absolute inset-0 bg-[url('/noise.png')] opacity-[0.15] z-20 mix-blend-overlay ${isHovered ? 'animate-pulse-fast' : 'animate-pulse-slow'}`} />

                {/* Vignette - Tightens on hover */}
                <motion.div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-20 pointer-events-none"
                    animate={{ scale: isHovered ? 0.9 : 1 }}
                    transition={{ duration: 0.5 }}
                />
            </motion.div>

            {/* Atmospheric Particles (Sparks/Dust) - "Embers" turn to "Fire" */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full blur-[1px]"
                        style={{
                            width: Math.random() * 2 + 1 + "px",
                            height: Math.random() * 2 + 1 + "px",
                            backgroundColor: i % 2 === 0 ? '#ef4444' : '#ffffff',
                            top: "100%",
                            left: Math.random() * 100 + "%",
                        }}
                        animate={{
                            y: [0, Math.random() * -1000 - 200],
                            x: [0, Math.random() * 100 - 50],
                            opacity: [0, isHovered ? 1 : 0.8, 0],
                            scale: [0, isHovered ? 2 : 1.5, 0],
                        }}
                        transition={{
                            duration: isHovered ? Math.random() * 3 + 2 : Math.random() * 8 + 5, // Faster on hover
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>

            {/* Main Content with 3D Tilt */}
            <motion.div
                className="relative z-30 container mx-auto px-4 text-center flex flex-col items-center justify-center h-full transform-style-3d will-change-transform gpu-accelerate"
                style={{ rotateX, rotateY }}
            >
                <motion.div
                    initial={{ opacity: 0, z: -100 }}
                    animate={{ opacity: 1, z: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="relative w-full"
                >
                    {/* Top Label */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-8"
                    >
                        <div className="h-[1px] w-8 md:w-12 bg-red-600/50" />
                        <span className="text-xs md:text-base font-bold text-red-500 uppercase tracking-[0.2em] md:tracking-[0.4em] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                            The Ultimate Truth
                        </span>
                        <div className="h-[1px] w-8 md:w-12 bg-red-600/50" />
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        className="text-fluid-h1 font-black tracking-tighter leading-[0.9] mb-6 md:mb-10 select-none relative z-20 will-change-transform gpu-accelerate"
                        style={{ x: titleX, y: titleY }}
                    >
                        <span className="block text-white mix-blend-overlay opacity-90 text-2xl md:text-4xl lg:text-6xl mb-2">FORGE YOUR</span>
                        <span className="block relative group cursor-default mt-2">
                            {/* Japanese Watermark - Glows on Hover */}
                            <motion.span
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] text-red-600/5 font-serif whitespace-nowrap pointer-events-none z-0 select-none hidden lg:block"
                                animate={{
                                    opacity: isHovered ? 0.2 : 0.05,
                                    scale: isHovered ? 1.05 : 1,
                                    textShadow: isHovered ? "0 0 30px rgba(220, 38, 38, 0.5)" : "none"
                                }}
                                transition={{ duration: 0.5 }}
                            >
                                精神を鍛える
                            </motion.span>

                            {/* Outline Text */}
                            <span className="absolute inset-0 text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.2)] md:[-webkit-text-stroke:2px_rgba(255,255,255,0.2)] blur-[1px] z-10" aria-hidden="true">
                                SPIRIT
                            </span>

                            {/* Main Text with Gradient - Pulses on Hover */}
                            <motion.span
                                className="relative text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 z-20 block text-[15vw] md:text-[11rem] leading-none"
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                    scale: isHovered ? [1, 1.02, 1] : 1,
                                }}
                                transition={{
                                    backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 0.2, repeat: isHovered ? Infinity : 0, repeatType: "reverse" } // Heartbeat effect
                                }}
                                style={{ backgroundSize: "200% auto" }}
                            >
                                SPIRIT
                            </motion.span>

                            {/* Glitch Effect Layers - Active on Hover */}
                            <motion.span
                                className="absolute inset-0 text-red-600 mix-blend-screen translate-x-[2px] z-20 text-[15vw] md:text-[11rem] leading-none"
                                animate={{ opacity: isHovered ? [0, 0.8, 0] : 0 }}
                                transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 0.5 }}
                                aria-hidden="true"
                            >
                                SPIRIT
                            </motion.span>
                            <motion.span
                                className="absolute inset-0 text-blue-600 mix-blend-screen translate-x-[-2px] z-20 text-[15vw] md:text-[11rem] leading-none"
                                animate={{ opacity: isHovered ? [0, 0.8, 0] : 0 }}
                                transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 0.5 + 0.1 }}
                                aria-hidden="true"
                            >
                                SPIRIT
                            </motion.span>

                            {/* Dynamic Glow Behind - Intensifies */}
                            <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-600/20 blur-[50px] md:blur-[100px] -z-10 rounded-full"
                                animate={{
                                    opacity: isHovered ? [0.3, 0.6, 0.3] : [0.1, 0.3, 0.1],
                                    scale: isHovered ? [1, 1.2, 1] : [0.9, 1.1, 0.9]
                                }}
                                transition={{ duration: isHovered ? 1 : 4, repeat: Infinity }}
                            />
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="relative max-w-2xl mx-auto mb-6 md:mb-16 px-4"
                    >
                        <p className="text-base md:text-xl text-gray-300 font-light leading-relaxed text-shadow-sm">
                            <span className="text-red-500 font-bold">Kyokushin</span> is not just a martial art. It is a way of life.
                            Discipline, respect, and the relentless pursuit of strength.
                        </p>
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.8 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 w-full px-4"
                    >
                        <Link href="/register" className="w-full md:w-auto">
                            <Button className="w-full md:w-auto group relative h-14 md:h-16 px-8 md:px-10 rounded-none bg-red-600 text-white text-base md:text-lg font-bold tracking-widest overflow-hidden transition-all hover:bg-red-700 hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] clip-path-slant">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    JOIN THE DOJO <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                            </Button>
                        </Link>
                        <Link href="/dojos" className="w-full md:w-auto">
                            <Button variant="outline" className="w-full md:w-auto group h-14 md:h-16 px-8 md:px-10 rounded-none border-white/30 text-white text-base md:text-lg font-bold tracking-widest hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm clip-path-slant">
                                <span className="flex items-center justify-center gap-2">
                                    FIND A DOJO <MapPinIcon className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                                </span>
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Scroll</span>
                <div className="w-[1px] h-16 bg-gradient-to-b from-red-600/50 to-transparent">
                    <motion.div
                        animate={{ y: [0, 64, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-1/2 bg-red-500 blur-[1px]"
                    />
                </div>
            </motion.div>

            {/* Side Accents */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-30">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1 bg-white/20 rounded-full ${i === 2 ? 'h-8 bg-red-600/80' : 'h-2'}`} />
                ))}
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-8 z-30 text-[10px] text-gray-600 font-mono rotate-90 origin-right">
                <span>EST. 1964</span>
                <span>OSU NO SEISHIN</span>
            </div>
        </section>
    );
}

function MapPinIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}
