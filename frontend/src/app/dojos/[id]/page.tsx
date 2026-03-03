"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Phone, Mail, Users, Calendar, ArrowLeft,
    ArrowUpRight, Camera, Shield, ChevronRight, Flame, Award,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";

/* ── Interfaces ── */
interface Instructor {
    id: string;
    name: string;
    role: string;
    email?: string;
    currentBeltRank: string;
    profilePhotoUrl: string | null;
}

interface Event {
    id: string;
    name: string;
    type: string;
    startDate: string;
    description: string;
}

interface Dojo {
    id: string;
    name: string;
    dojoCode?: string;
    city: string;
    state: string;
    address: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    instructors: Instructor[];
    gallery: any[];
    events: Event[];
}

/* ── Belt colours ── */
const BELT_COLORS: Record<string, string> = {
    WHITE: "bg-white text-black",
    ORANGE: "bg-orange-500 text-white",
    BLUE: "bg-blue-600 text-white",
    YELLOW: "bg-yellow-400 text-black",
    GREEN: "bg-green-600 text-white",
    BROWN: "bg-amber-800 text-white",
    BLACK: "bg-black text-white border border-white/20",
    "1ST_DAN": "bg-black text-white border border-yellow-500/50",
    "2ND_DAN": "bg-black text-white border border-yellow-500/50",
    "3RD_DAN": "bg-black text-white border border-yellow-500/50",
};

function getTimeUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d`;
    const hours = Math.floor(diff / 3600000);
    return `${hours}h`;
}

/* ───────────────────────────────────────────── */

export default function DojoDetailPage() {
    const params = useParams();
    const [dojo, setDojo] = useState<Dojo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    useEffect(() => {
        const fetchDojo = async () => {
            try {
                const response = await api.get(`/dojos/${params.id}`);
                setDojo(response.data.data.dojo);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load dojo details.");
            } finally {
                setIsLoading(false);
            }
        };
        if (params.id) fetchDojo();
    }, [params.id]);

    /* ── Loading ── */
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <KarateLoader />
            </div>
        );
    }

    /* ── Error ── */
    if (error || !dojo) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{error || "Dojo not found"}</h2>
                <p className="text-gray-500 mb-8 text-center max-w-md text-sm">
                    The dojo could not be loaded. Please try again later.
                </p>
                <Link href="/dojos">
                    <Button className="bg-white text-black hover:bg-gray-200 font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dojos
                    </Button>
                </Link>
            </div>
        );
    }

    const nextEvent = dojo.events[0];
    const countdown = nextEvent ? getTimeUntil(nextEvent.startDate) : null;

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-x-hidden selection:bg-red-600 selection:text-white">

            {/* ── HERO ── */}
            <div className="relative h-[75vh] min-h-[500px] w-full">
                {/* Background layers */}
                <div className="absolute inset-0">
                    <Image src="/dojo-bg.png" alt="Dojo" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                </div>

                {/* Decorative grid fade */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_top,black,transparent)]" />

                {/* Back nav */}
                <div className="absolute top-0 left-0 right-0 z-20 container-responsive pt-6">
                    <Link
                        href="/dojos"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-black/50"
                    >
                        <ArrowLeft className="w-4 h-4" /> All Dojos
                    </Link>
                </div>

                {/* Hero content */}
                <div className="absolute inset-0 container-responsive flex flex-col justify-end pb-16 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-900/40">
                                {dojo.city}
                            </span>
                            {dojo.dojoCode && (
                                <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-white/80 text-xs font-mono tracking-wider border border-white/10">
                                    {dojo.dojoCode}
                                </span>
                            )}
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400">Verified</span>
                            </div>
                        </div>

                        {/* Name */}
                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-5 leading-[0.9] uppercase">
                            {dojo.name}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span>{dojo.address || `${dojo.city}, ${dojo.state}`}</span>
                            </div>
                            {dojo.instructors.length > 0 && (
                                <>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-red-500" />
                                        <span>{dojo.instructors.length} Instructor{dojo.instructors.length !== 1 ? "s" : ""}</span>
                                    </div>
                                </>
                            )}
                            {dojo.events.length > 0 && (
                                <>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-red-500" />
                                        <span>{dojo.events.length} Upcoming</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── STAT RIBBON ── */}
            <div className="border-y border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm">
                <div className="container-responsive grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
                    {[
                        { label: "City", value: dojo.city },
                        { label: "State", value: dojo.state || "—" },
                        { label: "Instructors", value: String(dojo.instructors.length) },
                        { label: "Events", value: String(dojo.events.length) },
                    ].map((stat) => (
                        <div key={stat.label} className="py-5 px-6 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="container-responsive py-12 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About */}
                        <motion.section
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-600 via-red-600/50 to-transparent rounded-l-2xl" />
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <Flame className="w-4 h-4 text-red-500" />
                                </div>
                                About the Dojo
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Welcome to <span className="text-white font-medium">{dojo.name}</span>, a premier Kyokushin Karate dojo in {dojo.city}.
                                Dedicated to fostering strength, discipline, and spirit through traditional martial arts.
                                Our facility combines modern training equipment with the traditional atmosphere of a true dojo.
                            </p>
                        </motion.section>

                        {/* Instructors */}
                        {dojo.instructors.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-8"
                            >
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                        <Award className="w-4 h-4 text-red-500" />
                                    </div>
                                    Instructors
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {dojo.instructors.map((inst) => (
                                        <div
                                            key={inst.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-zinc-700/50 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {inst.profilePhotoUrl ? (
                                                    <Image src={inst.profilePhotoUrl} alt={inst.name} width={48} height={48} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-bold text-white/60">{inst.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">{inst.name}</p>
                                                {inst.currentBeltRank && (
                                                    <span
                                                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${BELT_COLORS[inst.currentBeltRank] || "bg-zinc-700 text-white/70"}`}
                                                    >
                                                        {inst.currentBeltRank.replace(/_/g, " ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Gallery */}
                        <motion.section
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-8"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-red-500" />
                                </div>
                                Gallery
                            </h2>

                            {dojo.gallery.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {dojo.gallery.slice(0, 6).map((photo: any, i: number) => (
                                        <div
                                            key={i}
                                            className="group aspect-square rounded-xl overflow-hidden bg-zinc-800 relative cursor-pointer"
                                            onClick={() => setLightboxIdx(i)}
                                        >
                                            <img
                                                src={photo.url || photo.imageUrl}
                                                alt={`Gallery ${i + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <ArrowUpRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/[0.08] rounded-xl">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center mb-4">
                                        <Camera className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">No photos yet</p>
                                    <p className="text-gray-600 text-xs mt-1">Gallery coming soon</p>
                                </div>
                            )}
                        </motion.section>
                    </div>

                    {/* RIGHT – Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Next Event Highlight */}
                        {nextEvent && countdown && (
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 via-red-900/10 to-transparent border border-red-600/20 p-6"
                            >
                                <div className="absolute top-3 right-3">
                                    <span className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 text-xs font-bold tabular-nums">
                                        in {countdown}
                                    </span>
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-red-400/80 font-semibold mb-2">Next Event</p>
                                <h3 className="font-bold text-sm mb-1 line-clamp-2 pr-16">{nextEvent.name}</h3>
                                <p className="text-xs text-gray-400">
                                    {new Date(nextEvent.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </p>
                                <Link href={`/events/${nextEvent.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                                    View Details <ChevronRight className="w-3 h-3" />
                                </Link>
                            </motion.div>
                        )}

                        {/* Location */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                </div>
                                <h3 className="font-bold">Location</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <p className="text-gray-200 font-semibold">{dojo.city}, {dojo.state}</p>
                                {dojo.address && <p className="text-gray-500 leading-relaxed">{dojo.address}</p>}
                                {dojo.contactPhone && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{dojo.contactPhone}</span>
                                    </div>
                                )}
                                {dojo.contactEmail && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{dojo.contactEmail}</span>
                                    </div>
                                )}
                            </div>
                            {dojo.latitude && dojo.longitude && (
                                <a
                                    href={`https://www.google.com/maps?q=${dojo.latitude},${dojo.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-800/60 border border-white/[0.06] hover:border-white/[0.12] text-xs text-gray-300 hover:text-white transition-all"
                                >
                                    <MapPin className="w-3.5 h-3.5" /> Open in Google Maps
                                    <ArrowUpRight className="w-3 h-3 text-gray-600" />
                                </a>
                            )}
                        </motion.div>

                        {/* Events */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-red-500" />
                                    </div>
                                    <h3 className="font-bold">Events</h3>
                                </div>
                                <Link href="/events" className="text-[11px] text-red-500 hover:text-red-400 transition-colors font-semibold tracking-wide uppercase">
                                    All →
                                </Link>
                            </div>

                            <div className="space-y-2.5">
                                {dojo.events.length > 0 ? (
                                    dojo.events.slice(0, 4).map((event) => (
                                        <Link key={event.id} href={`/events/${event.id}`}>
                                            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/60 border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-700/50 border border-white/[0.06] flex flex-col items-center justify-center">
                                                    <span className="text-[10px] text-gray-500 uppercase leading-none">
                                                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                                                    </span>
                                                    <span className="text-sm font-bold tabular-nums leading-tight">
                                                        {new Date(event.startDate).getDate()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-red-500/80 font-semibold uppercase tracking-wider mb-0.5">{event.type}</p>
                                                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors line-clamp-1">{event.name}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1" />
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                                        <Calendar className="w-6 h-6 text-gray-700 mb-2" />
                                        <p className="text-gray-600 text-xs">No upcoming events</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── GALLERY LIGHTBOX ── */}
            <AnimatePresence>
                {lightboxIdx !== null && dojo.gallery.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setLightboxIdx(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            src={dojo.gallery[lightboxIdx]?.url || dojo.gallery[lightboxIdx]?.imageUrl}
                            alt="Gallery"
                            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
