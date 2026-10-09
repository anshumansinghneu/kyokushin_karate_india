"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getEventStatus } from "@/lib/eventStatus";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "@/components/ui/portal";
import { formatDateOnly } from '@/lib/dateOnly';
import {
    MapPin,
    Calendar,
    ChevronRight,
    X,
    ChevronLeft,
    Camera,
    Mail,
    Phone,
    Share2,
    Download,
    ArrowUpRight,
} from "lucide-react";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";

/* ─── Past Seminar Data ─── */
const PAST_SEMINARS = [
    {
        id: "doctors",
        title: "Self Defense Seminar for Doctors",
        description:
            "Self-Defense Training workshop for doctors in OPD at Neuropedicon 2023, Agra on 2nd September 2023. The workshop empowered medical professionals with practical self-defense techniques for their safety during clinical practice.",
        date: "2 September 2023",
        location: "Agra, Uttar Pradesh",
        images: [
            "/seminars/doctors/1.jpg",
            "/seminars/doctors/2.jpg",
            "/seminars/doctors/3.jpg",
            "/seminars/doctors/4.jpg",
            "/seminars/doctors/5.jpg",
            "/seminars/doctors/6.jpg",
        ],
        highlight: "Neuropedicon 2023",
    },
    {
        id: "bmw",
        title: "Self Defense Seminar for BMW",
        description:
            "One day employee self-defense training was organized on 29th January 2023, at Speed Motorwagen Showroom, Lucknow. BMW employees learned essential self-defense skills in an engaging corporate workshop setting.",
        date: "29 January 2023",
        location: "Lucknow, Uttar Pradesh",
        images: [
            "/seminars/bmw/1.jpg",
            "/seminars/bmw/2.jpg",
            "/seminars/bmw/3.jpg",
            "/seminars/bmw/4.jpg",
            "/seminars/bmw/5.jpg",
            "/seminars/bmw/6.jpg",
        ],
        highlight: "Corporate Workshop",
    },
    {
        id: "bnsd",
        title: "Self Defense Seminar for BNSD Shiksha Niketan Balika Inter College",
        description:
            "Three Day Self Defence workshop was organised from 7 Oct 2024 to 10 Oct 2024. Young students were trained in practical self-defense techniques to ensure their personal safety.",
        date: "7\u201310 October 2024",
        location: "Uttar Pradesh",
        images: [
            "/seminars/bnsd/1.jpg",
            "/seminars/bnsd/2.jpg",
            "/seminars/bnsd/3.jpg",
        ],
        highlight: "3-Day Workshop",
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
                            {/* Plain img: natural size inside a contain box, which next/image's fill can't do here. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                className="col-span-2 row-span-2 relative rounded-lg overflow-hidden cursor-pointer group"
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
                className="relative rounded-lg overflow-hidden cursor-pointer group"
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
                className="relative rounded-lg overflow-hidden cursor-pointer group"
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
                className="relative rounded-lg overflow-hidden cursor-pointer group"
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
                className="relative rounded-lg overflow-hidden cursor-pointer group"
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
                    className="relative rounded-lg overflow-hidden cursor-pointer group"
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

/* ─── One seminar: meta and story side by side, the photographs below ─── */
function SeminarStory({
    title,
    description,
    highlight,
    date,
    location,
    images,
    mosaic,
}: {
    title: string;
    description?: string;
    highlight: string;
    date: string;
    location?: string;
    images: string[];
    mosaic: "six" | "three";
}) {
    const [lightbox, setLightbox] = useState<number | null>(null);

    return (
        <>
            <AnimatePresence>
                {lightbox !== null && (
                    <Lightbox
                        images={images}
                        index={lightbox}
                        title={title}
                        date={date}
                        location={location}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>

            <article className="border-t border-white/15 pt-10 md:pt-14">
                <Reveal className="grid gap-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-12">
                    <dl className="space-y-3 text-sm">
                        <div>
                            <dt className="sr-only">Format</dt>
                            <dd className="font-bold text-white">{highlight}</dd>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                            <dt className="sr-only">Date</dt>
                            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <dd>{date}</dd>
                        </div>
                        {location && (
                            <div className="flex items-center gap-2 text-white/70">
                                <dt className="sr-only">Place</dt>
                                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <dd>{location}</dd>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-white/50">
                            <dt className="sr-only">Photographs</dt>
                            <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <dd>{images.length} photos</dd>
                        </div>
                    </dl>
                    <div>
                        <h3 className="max-w-[24ch] text-balance text-[clamp(1.6rem,3.2vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.015em] text-white">
                            {title}
                        </h3>
                        {description && (
                            <p className="mt-4 max-w-[62ch] text-pretty text-lg leading-relaxed text-white/75">{description}</p>
                        )}
                    </div>
                </Reveal>

                <Reveal kind="depth" delay={0.1} className="mt-8 md:mt-10">
                    {mosaic === "six" ? (
                        <MosaicGallery6 images={images} title={title} onImageClick={setLightbox} />
                    ) : (
                        <MosaicGallery3 images={images} title={title} onImageClick={setLightbox} />
                    )}
                </Reveal>
            </article>
        </>
    );
}

/* ─── Stats ─── */
const STATS = [
    { label: "seminars conducted", value: "10+" },
    { label: "participants trained", value: "500+" },
    { label: "corporate partners", value: "5+" },
    { label: "states covered", value: "3+" },
];

const ctaClass =
    "group inline-flex min-h-12 items-center justify-center gap-2 rounded-none px-7 text-sm font-bold uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98]";

interface SeminarEvent {
    id: string;
    type: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
    galleryImages?: string[];
}

/* ─── Main Page ─── */
export default function SeminarsPage() {
    const [upcomingEvents, setUpcomingEvents] = useState<SeminarEvent[]>([]);
    const [completedSeminars, setCompletedSeminars] = useState<SeminarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/events");
            const seminars: SeminarEvent[] = (res.data.data.events || []).filter(
                (e: SeminarEvent) => e.type === "SEMINAR"
            );

            const now = new Date();
            const upcoming = seminars.filter((s) => getEventStatus(s, now) !== "COMPLETED");
            const completed = seminars.filter((s) => getEventStatus(s, now) === "COMPLETED");

            // Fetch gallery images for completed seminars
            const completedWithGallery = await Promise.all(
                completed.map(async (sem) => {
                    try {
                        const galleryRes = await api.get(`/gallery?eventId=${sem.id}&limit=6`);
                        return {
                            ...sem,
                            galleryImages: (galleryRes.data.data.items || []).map((i: { imageUrl: string }) => i.imageUrl),
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

    const dbStories = completedSeminars.filter((s) => (s.galleryImages?.length ?? 0) > 0);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* ─── Hero: the work itself ─── */}
            <Section rhythm="tight" width="wide" className="pt-6 md:pt-10">
                <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
                    <div className="lg:pb-6">
                        <h1 className="text-[clamp(2.75rem,7.5vw,5.75rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                            Self-defence<br />seminars<span className="text-primary">.</span>
                        </h1>
                        <p className="mt-6 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                            Practical self-defence for schools, hospitals, workplaces and communities, taught by
                            Kyokushin instructors across India.
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <a href="mailto:info@kyokushinfoundation.com" className={`${ctaClass} bg-primary text-white hover:bg-primary-dark`}>
                                <Mail className="h-4 w-4" aria-hidden="true" /> Book a seminar
                            </a>
                            <a href="#past" className={`${ctaClass} border border-white/25 text-white hover:border-white/60 hover:bg-white/10`}>
                                See past seminars
                            </a>
                        </div>
                    </div>
                    <Reveal kind="depth">
                        <figure className="relative overflow-hidden rounded-xl bg-surface">
                            <Image
                                src="/seminars/bnsd/1.jpg"
                                alt="A student blocks a grab during the three-day workshop at BNSD Shiksha Niketan Balika Inter College while her classmates watch"
                                width={900}
                                height={600}
                                priority
                                sizes="(max-width: 1024px) 100vw, 55vw"
                                className="aspect-[3/2] w-full object-cover"
                            />
                            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-14 text-sm font-semibold text-white/85">
                                BNSD Shiksha Niketan Balika Inter College, October 2024
                            </figcaption>
                        </figure>
                    </Reveal>
                </div>
            </Section>

            {/* ─── The reach, in one sentence ─── */}
            <Section rhythm="tight" width="wide">
                <Reveal kind="focus">
                    <p className="max-w-[30ch] text-balance text-[clamp(1.6rem,3.6vw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.015em] text-white/45">
                        <span className="text-white">{STATS[0].value} {STATS[0].label}</span>, with{" "}
                        <span className="text-white">{STATS[1].value} {STATS[1].label}</span> and{" "}
                        <span className="text-white">{STATS[2].value} {STATS[2].label}</span>, across{" "}
                        <span className="text-white">{STATS[3].value} states</span>.
                    </p>
                </Reveal>
            </Section>

            {/* ─── Upcoming ─── */}
            <Section rhythm="base" width="wide">
                <Heading>Upcoming seminars</Heading>
                {isLoading ? (
                    <div aria-busy="true" className="mt-8 h-24 animate-pulse border-y border-white/10 bg-white/[0.03] motion-reduce:animate-none" />
                ) : upcomingEvents.length > 0 ? (
                    <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
                        {upcomingEvents.map((event) => (
                            <li key={event.id}>
                                <Link href={`/events/${event.id}`} className="group grid items-center gap-2 py-6 sm:grid-cols-[12rem_1fr_auto] sm:gap-8">
                                    <span className="font-bold text-white">
                                        {formatDateOnly(event.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}
                                    </span>
                                    <span>
                                        <span className="block text-lg font-extrabold text-white transition-colors group-hover:text-primary-light md:text-xl">{event.name}</span>
                                        <span className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {event.location || "Venue to be announced"}
                                        </span>
                                    </span>
                                    <ArrowUpRight className="hidden h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white sm:block" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-white/70">
                        No open seminars are scheduled right now. Most are arranged directly with a school or
                        organisation; write to us to set one up.
                    </p>
                )}
            </Section>

            {/* ─── Past seminars ─── */}
            <Section id="past" rhythm="base" width="wide" className="scroll-mt-24">
                <Heading>Past seminars</Heading>
                <div className="mt-10 space-y-16 md:space-y-24">
                    {/* DB-fetched completed seminars (with gallery) */}
                    {dbStories.map((sem) => {
                        const images: string[] = sem.galleryImages || [];
                        return (
                            <SeminarStory
                                key={sem.id}
                                title={sem.name}
                                description={sem.description}
                                highlight="Seminar"
                                date={formatDateOnly(sem.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}
                                location={sem.location}
                                images={images.length >= 5 ? images.slice(0, 6) : images.slice(0, 3)}
                                mosaic={images.length >= 5 ? "six" : "three"}
                            />
                        );
                    })}

                    {/* Original hardcoded showcase seminars */}
                    {PAST_SEMINARS.map((seminar) => (
                        <SeminarStory
                            key={seminar.id}
                            title={seminar.title}
                            description={seminar.description}
                            highlight={seminar.highlight}
                            date={seminar.date}
                            location={seminar.location}
                            images={seminar.images}
                            mosaic={seminar.images.length >= 6 ? "six" : "three"}
                        />
                    ))}
                </div>
            </Section>

            {/* ─── Closing ─── */}
            <Section rhythm="open" width="wide">
                <Reveal kind="mask">
                    <Heading size="display" className="max-w-[16ch] uppercase">
                        Bring a seminar to your organisation<span className="text-primary">.</span>
                    </Heading>
                </Reveal>
                <Reveal delay={0.1}>
                    <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-white/75">
                        KKFI runs self-defence workshops for schools, colleges, hospitals, corporates and
                        community groups, from a single session to several days.
                    </p>
                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <a href="mailto:info@kyokushinfoundation.com" className={`${ctaClass} bg-primary text-white hover:bg-primary-dark`}>
                            <Mail className="h-4 w-4" aria-hidden="true" /> Get in touch
                        </a>
                        <a href="tel:+919956745114" className={`${ctaClass} border border-white/25 text-white hover:border-white/60 hover:bg-white/10`}>
                            <Phone className="h-4 w-4" aria-hidden="true" /> +91 99567 45114
                        </a>
                    </div>
                </Reveal>
            </Section>
        </div>
    );
}
