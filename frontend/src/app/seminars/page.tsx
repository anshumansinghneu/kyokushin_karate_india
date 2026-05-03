"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "@/components/ui/portal";
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
    Mail,
    Phone,
    Share2,
    Download,
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
    title,
    date,
    location,
    onClose,
}: {
    images: string[];
    index: number;
    title: string;
    date: string;
    location?: string;
    onClose: () => void;
}) {
    const [current, setCurrent] = useState(index);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight" && current < images.length - 1) setCurrent((p) => p + 1);
            if (e.key === "ArrowLeft" && current > 0) setCurrent((p) => p - 1);
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKey);
        };
    }, [images.length, onClose, current]);

    const handleShare = async () => {
        const shareData = {
            title: `${title} — KKFI Seminar`,
            text: title,
            url: typeof window !== "undefined" ? window.location.href : "",
        };
        if (typeof navigator !== "undefined" && navigator.share) {
            try { await navigator.share(shareData); } catch {}
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            try { await navigator.clipboard.writeText(shareData.url); } catch {}
        }
    };

    return (
        <Portal>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
                onClick={onClose}
            >
                {/* Cinematic blurred backdrop — current image */}
                <AnimatePresence mode="sync">
                    <motion.div
                        key={`bg-${current}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 overflow-hidden"
                    >
                        <Image
                            src={images[current]}
                            alt=""
                            fill
                            sizes="100vw"
                            className="object-cover scale-110 blur-3xl"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

                {/* Top bar */}
                <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/70 to-transparent">
                    <div
                        className="flex flex-col gap-1.5 max-w-[60%] sm:max-w-2xl px-3 sm:px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-white text-sm sm:text-base font-bold line-clamp-1">
                            {title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-red-500" />
                                {date}
                            </span>
                            {location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-red-500" />
                                    {location}
                                </span>
                            )}
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-2 sm:gap-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleShare}
                            className="p-2.5 sm:p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md text-white"
                            title="Share"
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <a
                            href={images[current]}
                            download
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 sm:p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md text-white hidden sm:flex"
                            title="Download"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2.5 sm:p-3 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 rounded-xl transition-colors backdrop-blur-md text-white"
                            title="Close"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Side arrows */}
                {current > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrent(current - 1); }}
                        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all text-white z-50 group border border-white/10"
                        title="Previous"
                    >
                        <ChevronLeft className="w-5 sm:w-7 h-5 sm:h-7 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
                {current < images.length - 1 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrent(current + 1); }}
                        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all text-white z-50 group border border-white/10"
                        title="Next"
                    >
                        <ChevronRight className="w-5 sm:w-7 h-5 sm:h-7 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}

                {/* Image area — swipeable */}
                <motion.div
                    className="relative w-full h-full flex items-center justify-center px-4 sm:px-20 pt-24 pb-32 touch-pan-y"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, info) => {
                        if (Math.abs(info.offset.x) > 80) {
                            if (info.offset.x > 0 && current > 0) {
                                setCurrent(current - 1);
                            } else if (info.offset.x < 0 && current < images.length - 1) {
                                setCurrent(current + 1);
                            }
                        }
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="relative max-w-[90vw] max-h-[78vh] w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={images[current]}
                                alt={`${title} — photo ${current + 1}`}
                                className="max-w-full max-h-[78vh] w-auto h-auto object-contain rounded-lg drop-shadow-2xl select-none pointer-events-none"
                                draggable={false}
                            />
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Bottom: counter + thumbnail strip */}
                <div
                    className="absolute bottom-0 inset-x-0 z-50 pb-4 sm:pb-6 px-4 sm:px-6 bg-gradient-to-t from-black/70 to-transparent pt-12"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-end gap-3 max-w-full">
                        <div className="hidden sm:flex shrink-0 items-center px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-xs text-white/80 font-medium">
                            {current + 1} <span className="text-white/40 mx-1">/</span> {images.length}
                        </div>

                        {images.length > 1 && (
                            <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                                <div className="flex gap-2 justify-center min-w-min">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                                            className={`relative shrink-0 h-12 w-16 sm:h-14 sm:w-20 rounded-lg overflow-hidden transition-all duration-200 ${
                                                i === current
                                                    ? "ring-2 ring-red-500 opacity-100 scale-105"
                                                    : "opacity-50 hover:opacity-100 ring-1 ring-white/10"
                                            }`}
                                            title={`Photo ${i + 1}`}
                                        >
                                            <Image
                                                src={img}
                                                alt=""
                                                fill
                                                sizes="80px"
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sm:hidden mt-2 text-center text-xs text-white/60 font-medium">
                        {current + 1} / {images.length}
                    </div>
                </div>
            </motion.div>
        </Portal>
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
        badge: "bg-white/5 border-white/10 text-zinc-400",
    };

    return (
        <>
            <AnimatePresence>
                {lightbox !== null && (
                    <Lightbox
                        images={seminar.images}
                        index={lightbox}
                        title={seminar.title}
                        date={seminar.date}
                        location={seminar.location}
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

/* ─── DB Seminar Section (for seminars from database) ─── */
function DBSeminarSection({ seminar, index }: { seminar: any; index: number }) {
    const [lightbox, setLightbox] = useState<number | null>(null);
    const images: string[] = seminar.galleryImages || [];

    if (images.length === 0) return null;

    return (
        <>
            <AnimatePresence>
                {lightbox !== null && (
                    <Lightbox
                        images={images}
                        index={lightbox}
                        title={seminar.name}
                        date={new Date(seminar.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        location={seminar.location}
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
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-red-900/40 rounded-3xl blur-3xl opacity-30 -z-10" />

                <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-3xl overflow-hidden">
                    <div className="p-6 md:p-10 pb-0 md:pb-0">
                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                                <Shield size={22} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 uppercase tracking-wider">
                                        Seminar
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                        <Camera size={12} />
                                        {images.length} Photos
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight">
                                    {seminar.name}
                                </h3>
                                {seminar.description && (
                                    <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-3xl">
                                        {seminar.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm pt-1">
                                    <div className="flex items-center gap-2 text-gray-300 bg-white/5 rounded-full px-3 py-1.5">
                                        <Calendar size={14} className="text-red-500" />
                                        {new Date(seminar.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                    </div>
                                    {seminar.location && (
                                        <div className="flex items-center gap-2 text-gray-300 bg-white/5 rounded-full px-3 py-1.5">
                                            <MapPin size={14} className="text-red-500" />
                                            {seminar.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 pt-4">
                        {images.length >= 5 ? (
                            <MosaicGallery6
                                images={images.slice(0, 6)}
                                title={seminar.name}
                                onImageClick={setLightbox}
                            />
                        ) : (
                            <MosaicGallery3
                                images={images.slice(0, 3)}
                                title={seminar.name}
                                onImageClick={setLightbox}
                            />
                        )}
                    </div>
                </div>
            </motion.section>
        </>
    );
}

/* ─── Main Page ─── */
export default function SeminarsPage() {
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [completedSeminars, setCompletedSeminars] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/events");
            const seminars = (res.data.data.events || []).filter(
                (e: any) => e.type === "SEMINAR"
            );

            const now = new Date();
            const upcoming = seminars.filter((s: any) => s.status === "UPCOMING" || s.status === "ONGOING" || new Date(s.startDate) > now);
            const completed = seminars.filter((s: any) => s.status === "COMPLETED" || (new Date(s.endDate) < now && s.status !== "UPCOMING"));

            // Fetch gallery images for completed seminars
            const completedWithGallery = await Promise.all(
                completed.map(async (sem: any) => {
                    try {
                        const galleryRes = await api.get(`/gallery?eventId=${sem.id}&limit=6`);
                        return {
                            ...sem,
                            galleryImages: (galleryRes.data.data.items || []).map((i: any) => i.imageUrl),
                        };
                    } catch {
                        return { ...sem, galleryImages: [] };
                    }
                })
            );

            setUpcomingEvents(upcoming);
            setCompletedSeminars(completedWithGallery);
        } catch (err) {
            console.error("Failed to fetch seminars", err);
            setUpcomingEvents([]);
            setCompletedSeminars([]);
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

                <div className="container-responsive relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-center"
                    >
                        <h1 className="font-black tracking-tighter uppercase leading-[0.9] mb-5" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
                            <span className="inline-flex items-center gap-3 md:gap-4">
                                <span className="text-white">SELF</span>
                                <img src="/kkfi-logo.png" alt="KKFI" className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white/10 shadow-[0_0_20px_rgba(220,38,38,0.2)]" />
                                <span className="text-white">DEFENSE</span>
                            </span>
                            <br />
                            <span
                                className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                                style={{
                                    background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                }}
                            >SEMINARS</span>
                        </h1>
                        <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
                            Practical self-defense training for schools, corporates, and communities across India.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ─── Seminars Showcase ─── */}
            <section className="py-6 md:py-10">
                <div className="container-responsive">
                    <div className="flex items-center justify-center gap-3 mb-12">
                        <div className="flex-1 max-w-[100px] h-px bg-gradient-to-r from-transparent to-white/[0.06]" />
                        <h2 className="text-lg font-black uppercase tracking-tight text-white">Past Seminars</h2>
                        <div className="flex-1 max-w-[100px] h-px bg-gradient-to-l from-transparent to-white/[0.06]" />
                    </div>

                    <div className="space-y-12 md:space-y-16">
                        {/* DB-fetched completed seminars (with gallery) */}
                        {completedSeminars.filter((s: any) => s.galleryImages?.length > 0).map((sem: any, i: number) => (
                            <DBSeminarSection key={sem.id} seminar={sem} index={i} />
                        ))}

                        {/* Original hardcoded showcase seminars (fallback) */}
                        {PAST_SEMINARS.map((seminar, i) => (
                            <SeminarSection key={seminar.id} seminar={seminar} index={completedSeminars.length + i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Stats ─── */}
            <section className="py-12 md:py-16">
                <div className="container-responsive">
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
                <div className="container-responsive">
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
                    ) : upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event) => (
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
                        <div className="text-center py-10">
                            <p className="text-sm text-zinc-600">No upcoming seminars scheduled</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-8 md:py-12">
                <div className="container-responsive">
                    <div className="relative border border-white/[0.06] rounded-2xl overflow-hidden text-center p-8 md:p-14">
                        {/* Red gradient top accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

                        <img src="/kkfi-logo.png" alt="KKFI" className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/10 shadow-[0_0_20px_rgba(220,38,38,0.15)] mx-auto mb-5 opacity-60" />

                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3 leading-tight">
                            Want a seminar at your <span style={{
                                background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                            }}>organization?</span>
                        </h2>
                        <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed mb-8">
                            KKFI conducts self-defense workshops for schools, colleges, corporates, and community groups.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <a
                                href="mailto:info@kyokushinfoundation.com"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                            >
                                <Mail size={14} /> Get In Touch
                            </a>
                            <a
                                href="tel:+919956745114"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/[0.08] transition-colors"
                            >
                                <Phone size={14} /> +91-9956745114
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
