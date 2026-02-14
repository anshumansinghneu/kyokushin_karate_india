"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    Calendar,
    ChevronRight,
    Shield,
    Users,
    Building2,
    GraduationCap,
    X,
    ChevronLeft,
    Stethoscope,
    Camera,
} from "lucide-react";

/* ─── Past Seminar Data ─── */
const PAST_SEMINARS = [
    {
        id: "doctors",
        title: "Self Defense Seminar for Doctors",
        description:
            "Self-Defense Training workshop for doctors in OPD at Neuropedicon 2023, Agra on 2nd September 2023. The workshop empowered medical professionals with practical self-defense techniques for their safety during clinical practice.",
        date: "2 September 2023",
        location: "Agra, Uttar Pradesh",
        icon: Stethoscope,
        images: [
            "/seminars/doctors/1.jpg",
            "/seminars/doctors/2.jpg",
            "/seminars/doctors/3.jpg",
            "/seminars/doctors/4.jpg",
            "/seminars/doctors/5.jpg",
            "/seminars/doctors/6.jpg",
        ],
        highlight: "Neuropedicon 2023",
        color: "from-blue-600/20 to-blue-900/40",
        accent: "blue",
    },
    {
        id: "bmw",
        title: "Self Defense Seminar for BMW",
        description:
            "One day employee self-defense training was organized on 29th January 2023, at Speed Motorwagen Showroom, Lucknow. BMW employees learned essential self-defense skills in an engaging corporate workshop setting.",
        date: "29 January 2023",
        location: "Lucknow, Uttar Pradesh",
        icon: Building2,
        images: [
            "/seminars/bmw/1.jpg",
            "/seminars/bmw/2.jpg",
            "/seminars/bmw/3.jpg",
            "/seminars/bmw/4.jpg",
            "/seminars/bmw/5.jpg",
            "/seminars/bmw/6.jpg",
        ],
        highlight: "Corporate Workshop",
        color: "from-emerald-600/20 to-emerald-900/40",
        accent: "emerald",
    },
    {
        id: "bnsd",
        title: "Self Defense Seminar for BNSD Shiksha Niketan Balika Inter College",
        description:
            "Three Day Self Defence workshop was organised from 7 Oct 2024 to 10 Oct 2024. Young students were trained in practical self-defense techniques to ensure their personal safety.",
        date: "7\u201310 October 2024",
        location: "Uttar Pradesh",
        icon: GraduationCap,
        images: [
            "/seminars/bnsd/1.jpg",
            "/seminars/bnsd/2.jpg",
            "/seminars/bnsd/3.jpg",
        ],
        highlight: "3-Day Workshop",
        color: "from-amber-600/20 to-amber-900/40",
        accent: "amber",
    },
];

/* ─── Lightbox Component ─── */
function Lightbox({
    images,
    index,
    onClose,
}: {
    images: string[];
    index: number;
    onClose: () => void;
}) {
    const [current, setCurrent] = useState(index);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setCurrent((p) => (p + 1) % images.length);
            if (e.key === "ArrowLeft") setCurrent((p) => (p - 1 + images.length) % images.length);
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKey);
        };
    }, [images.length, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/60 hover:text-white z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
            >
                <X size={24} />
            </button>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent((p) => (p - 1 + images.length) % images.length);
                        }}
                        className="absolute left-4 md:left-8 text-white/60 hover:text-white z-10 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent((p) => (p + 1) % images.length);
                        }}
                        className="absolute right-4 md:right-8 text-white/60 hover:text-white z-10 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative w-[90vw] h-[80vh] max-w-6xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[current]}
                    alt="Seminar photo"
                    fill
                    className="object-contain"
                    sizes="90vw"
                />
            </motion.div>

            {images.length > 1 && (
                <div className="absolute bottom-8 flex gap-2">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrent(i);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                i === current ? "bg-red-500 w-8" : "bg-white/30 hover:bg-white/50 w-2"
                            }`}
                        />
                    ))}
                </div>
            )}

            <div className="absolute bottom-16 text-white/50 text-sm font-medium">
                {current + 1} / {images.length}
            </div>
        </motion.div>
    );
}

/* ─── Mosaic Gallery for 6 images ─── */
function MosaicGallery6({
    images,
    title,
    onImageClick,
}: {
    images: string[];
    title: string;
    onImageClick: (index: number) => void;
}) {
    return (
        <div className="grid grid-cols-4 grid-rows-2 gap-2 md:gap-3 h-[400px] md:h-[500px] lg:h-[560px]">
            {/* Large left image */}
            <div
                className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => onImageClick(0)}
            >
                <Image
                    src={images[0]}
                    alt={`${title} 1`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width:768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <Camera size={16} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Top-right two images */}
            <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => onImageClick(1)}
            >
                <Image
                    src={images[1]}
                    alt={`${title} 2`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width:768px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
            <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => onImageClick(2)}
            >
                <Image
                    src={images[2]}
                    alt={`${title} 3`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width:768px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>

            {/* Bottom-right two images */}
            <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => onImageClick(3)}
            >
                <Image
                    src={images[3]}
                    alt={`${title} 4`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width:768px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
            <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => onImageClick(4)}
            >
                <Image
                    src={images[4]}
                    alt={`${title} 5`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width:768px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
        </div>
    );
}

/* ─── Gallery for 3 images ─── */
function MosaicGallery3({
    images,
    title,
    onImageClick,
}: {
    images: string[];
    title: string;
    onImageClick: (index: number) => void;
}) {
    return (
        <div className="grid grid-cols-3 gap-2 md:gap-3 h-[300px] md:h-[400px] lg:h-[450px]">
            {images.map((img, i) => (
                <div
                    key={i}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => onImageClick(i)}
                >
                    <Image
                        src={img}
                        alt={`${title} ${i + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="(max-width:768px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                            <Camera size={14} className="text-white" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Seminar Section Component ─── */
function SeminarSection({
    seminar,
    index,
}: {
    seminar: (typeof PAST_SEMINARS)[0];
    index: number;
}) {
    const [lightbox, setLightbox] = useState<number | null>(null);
    const Icon = seminar.icon;

    const accentClasses = {
        blue: {
            badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        },
        emerald: {
            badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        },
        amber: {
            badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        },
    }[seminar.accent] || {
        badge: "bg-red-500/10 border-red-500/20 text-red-400",
    };

    return (
        <>
            <AnimatePresence>
                {lightbox !== null && (
                    <Lightbox
                        images={seminar.images}
                        index={lightbox}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>

            <motion.section
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="relative"
            >
                {/* Background glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${seminar.color} rounded-3xl blur-3xl opacity-30 -z-10`} />

                <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-3xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-10 pb-0 md:pb-0">
                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentClasses.badge} border shrink-0`}>
                                <Icon size={22} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${accentClasses.badge} border uppercase tracking-wider`}>
                                        {seminar.highlight}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                        <Camera size={12} />
                                        {seminar.images.length} Photos
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight">
                                    {seminar.title}
                                </h3>
                                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-3xl">
                                    {seminar.description}
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm pt-1">
                                    <div className="flex items-center gap-2 text-gray-300 bg-white/5 rounded-full px-3 py-1.5">
                                        <Calendar size={14} className="text-red-500" />
                                        {seminar.date}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300 bg-white/5 rounded-full px-3 py-1.5">
                                        <MapPin size={14} className="text-red-500" />
                                        {seminar.location}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className="p-4 md:p-6 pt-4">
                        {seminar.images.length >= 6 ? (
                            <MosaicGallery6
                                images={seminar.images}
                                title={seminar.title}
                                onImageClick={setLightbox}
                            />
                        ) : (
                            <MosaicGallery3
                                images={seminar.images}
                                title={seminar.title}
                                onImageClick={setLightbox}
                            />
                        )}
                    </div>
                </div>
            </motion.section>
        </>
    );
}

/* ─── Stats ─── */
const STATS = [
    { label: "Seminars Conducted", value: "10+", icon: Shield },
    { label: "Participants Trained", value: "500+", icon: Users },
    { label: "Corporate Partners", value: "5+", icon: Building2 },
    { label: "States Covered", value: "3+", icon: MapPin },
];

/* ─── Main Page ─── */
export default function SeminarsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/events");
            const seminars = res.data.data.events.filter(
                (e: any) => e.type === "SEMINAR"
            );
            setEvents(seminars);
        } catch (err) {
            console.error("Failed to fetch seminars", err);
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* ─── Hero ─── */}
            <section className="relative pt-28 pb-20 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
                    <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold px-5 py-2 rounded-full mb-8 uppercase tracking-widest"
                        >
                            <Shield size={14} />
                            Teaching Self Defense
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
                            <span className="text-white">SELF DEFENSE</span>
                            <br />
                            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                                SEMINARS
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                            Empowering communities through practical self-defense training.
                            From corporate workshops to school programs, KKFI brings Kyokushin
                            discipline to every walk of life.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ─── Seminars Showcase ─── */}
            <section className="py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            OUR{" "}
                            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                                SEMINARS
                            </span>
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full mb-5" />
                        <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
                            Seminars conducted by Kyokushin Karate Foundation of India across
                            schools, hospitals, and corporate organizations.
                        </p>
                    </motion.div>

                    <div className="space-y-12 md:space-y-16">
                        {PAST_SEMINARS.map((seminar, i) => (
                            <SeminarSection key={seminar.id} seminar={seminar} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Stats ─── */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto"
                    >
                        {STATS.map((stat) => {
                            const StatIcon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="text-center bg-white/[0.03] border border-white/[0.06] rounded-2xl py-6 px-4 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group"
                                >
                                    <StatIcon size={20} className="mx-auto text-red-600/60 mb-2 group-hover:text-red-500 transition-colors" />
                                    <div className="text-3xl md:text-4xl font-black text-white">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ─── Upcoming Seminars ─── */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            UPCOMING{" "}
                            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                                SEMINARS
                            </span>
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full mb-5" />
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Register for our upcoming self-defense training seminars.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <Link
                                    href={`/events/${event.id}`}
                                    key={event.id}
                                    className="group"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/[0.06] hover:border-red-600/30 transition-all duration-300 h-full flex flex-col group-hover:shadow-lg group-hover:shadow-red-600/5"
                                    >
                                        <div className="h-48 bg-gradient-to-br from-red-950/30 to-zinc-900 relative flex items-center justify-center">
                                            <Shield
                                                size={56}
                                                className="text-red-600/10"
                                                strokeWidth={1}
                                            />
                                            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                UPCOMING
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-2">
                                                <Calendar size={14} />
                                                {new Date(event.startDate).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <h2 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors">
                                                {event.name}
                                            </h2>
                                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                                                <MapPin size={14} />
                                                {event.location || "TBA"}
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                                                VIEW DETAILS
                                                <ChevronRight size={14} className="text-red-500" />
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-3xl bg-zinc-900/20">
                            <Shield size={48} className="mx-auto text-zinc-800 mb-4" strokeWidth={1} />
                            <p className="text-gray-500 text-lg font-medium">
                                No upcoming seminars scheduled
                            </p>
                            <p className="text-gray-600 text-sm mt-2">
                                Check back later for new self-defense training events
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-3xl p-8 md:p-16 text-center overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-transparent to-transparent" />
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px]" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mx-auto mb-6">
                                <Shield size={28} className="text-red-500" />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                                Want a Seminar at Your Organization?
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
                                KKFI conducts self-defense workshops for schools, colleges,
                                corporates, and community groups. Contact us to schedule a session.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="mailto:info@kyokushinfoundation.com"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all hover:shadow-lg hover:shadow-red-600/20"
                                >
                                    Get In Touch
                                </a>
                                <a
                                    href="tel:+919956745114"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold transition-all border border-white/10 hover:border-white/20"
                                >
                                    Call: +91-9956745114
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
