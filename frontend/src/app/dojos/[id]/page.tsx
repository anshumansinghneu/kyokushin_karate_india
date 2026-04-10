"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Phone, Mail, Users, Calendar, ArrowLeft,
    ArrowUpRight, Camera, Shield, ChevronRight, Navigation, Clock, Activity, Flag, Info, Award
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import 'leaflet/dist/leaflet.css';

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

const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777], delhi: [28.7041, 77.1025], bangalore: [12.9716, 77.5946],
  kolkata: [22.5726, 88.3639], chennai: [13.0827, 80.2707], hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567], ahmedabad: [23.0225, 72.5714], surat: [21.1702, 72.8311],
  jaipur: [26.9124, 75.7873], lucknow: [26.8467, 80.9462], kanpur: [26.4499, 80.3319],
  nagpur: [21.1458, 79.0882], patna: [25.5941, 85.1376], indore: [22.7196, 75.8577],
  bhopal: [23.2599, 77.4126], visakhapatnam: [17.6868, 83.2185], vadodara: [22.3072, 73.1812],
  kochi: [9.9312, 76.2673], guwahati: [26.1445, 91.7362], bhubaneswar: [20.2961, 85.8245],
  dehradun: [30.3165, 78.0322], chandigarh: [30.7333, 76.7794], noida: [28.5355, 77.391],
  gurugram: [28.4595, 77.0266], alipurduar: [26.4918, 89.5271]
};

const BELT_COLORS: Record<string, string> = {
    WHITE: "bg-white text-black",
    ORANGE: "bg-orange-500 text-white",
    BLUE: "bg-[#1d4ed8] text-white",
    YELLOW: "bg-yellow-400 text-black",
    GREEN: "bg-[#15803d] text-white",
    BROWN: "bg-amber-900 text-white",
    BLACK: "bg-black text-white border border-white/20",
    "1ST_DAN": "bg-black text-white border border-yellow-500/50",
    "2ND_DAN": "bg-black text-white border border-yellow-500/50",
    "3RD_DAN": "bg-black text-white border border-yellow-500/50",
};

export default function DojoDetailPage() {
    const params = useParams();
    const [dojo, setDojo] = useState<Dojo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    
    // Mini-map map reference
    const mapRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        // Lock page to pure black
        document.documentElement.style.background = '#000';
        return () => {
            document.documentElement.style.background = '';
        };
    }, []);

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

    useEffect(() => {
        if (!dojo || !mapRef.current || mapInstanceRef.current) return;

        let coords: [number, number] | null = null;
        if (dojo.latitude && dojo.longitude) {
            coords = [dojo.latitude, dojo.longitude];
        } else if (dojo.city && CITY_COORDS[dojo.city.toLowerCase()]) {
            coords = CITY_COORDS[dojo.city.toLowerCase()];
        }

        if (!coords) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;
            if (!mapRef.current || mapInstanceRef.current) return;

            const map = L.map(mapRef.current, {
                center: coords!,
                zoom: 14,
                zoomControl: false,
                attributionControl: false,
                scrollWheelZoom: false,
                dragging: false,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
            }).addTo(map);

            const pinHTML = `<div style="width:20px;height:20px;border-radius:50%;background:#dc2626;border:2.5px solid #fff;box-shadow:0 0 12px rgba(220,38,38,0.4);"></div>`;
            const icon = L.divIcon({
                html: pinHTML,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                className: '',
            });

            L.marker(coords!, { icon }).addTo(map);
            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [dojo]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <KarateLoader />
            </div>
        );
    }

    if (error || !dojo) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{error || "Dojo not found"}</h2>
                <p className="text-zinc-500 mb-8 text-center max-w-md text-sm">
                    The requested Dojo record could not be loaded. Please try again.
                </p>
                <Link href="/find-a-dojo">
                    <Button className="bg-white text-black hover:bg-gray-200 font-semibold px-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Unified Directory
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-red-600 selection:text-white">
            
            {/* ── HERO ── */}
            <div className="relative min-h-[380px] w-full">
                {/* Background */}
                <div className="absolute inset-0">
                    <Image src="/dojo-bg.png" alt="Dojo" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Back Nav */}
                <div className="absolute top-0 left-0 right-0 z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                    <Link
                        href="/find-a-dojo"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> All Dojos
                    </Link>
                </div>

                {/* Content */}
                <div className="absolute inset-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                    >
                        {/* Badges — clean, minimal */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {dojo.dojoCode && (
                                <span className="px-2.5 py-1 rounded bg-red-600 text-white text-[8px] font-extrabold uppercase tracking-[2px]">
                                    {dojo.dojoCode}
                                </span>
                            )}
                            <span className="px-2.5 py-1 rounded bg-white/[0.06] border border-white/[0.08] text-white/70 text-[8px] font-bold uppercase tracking-[2px]">
                                {dojo.city}, {dojo.state}
                            </span>
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-[2px]">
                                <Shield className="w-2.5 h-2.5" /> Verified
                            </span>
                        </div>

                        {/* Name — capped size so long names don't break */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-4 leading-snug text-white">
                            {dojo.name}
                        </h1>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-4 text-[12px] text-zinc-400 mb-5">
                            {dojo.address && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                    {dojo.address}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-red-500" />
                                {dojo.instructors?.length || 0} Instructor{dojo.instructors?.length !== 1 ? 's' : ''}
                            </span>
                            {dojo.events?.length > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                                    {dojo.events.length} Event{dojo.events.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex flex-wrap gap-2">
                            {(dojo.latitude && dojo.longitude) && (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${dojo.latitude},${dojo.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                                >
                                    <Navigation className="w-3.5 h-3.5" /> Get Directions
                                </a>
                            )}
                            {dojo.contactPhone && (
                                <a
                                    href={`tel:${dojo.contactPhone}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-white/[0.1] transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5" /> Call
                                </a>
                            )}
                            {dojo.contactEmail && (
                                <a
                                    href={`mailto:${dojo.contactEmail}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-white/[0.1] transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" /> Email
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-32 grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* LEFT PORTFOLIO COLUMN */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* About */}
                    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Dojo Overview
                        </h2>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl">
                            <div className="text-zinc-400 leading-relaxed text-sm space-y-2">
                                <p>Official KKFI registered branch in {dojo.city}, {dojo.state}.</p>
                                {dojo.address && <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" /> {dojo.address}</p>}
                                {dojo.contactPhone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {dojo.contactPhone}</p>}
                                {dojo.contactEmail && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {dojo.contactEmail}</p>}
                            </div>
                        </div>
                    </motion.div>

                    {/* Instructors */}
                    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Faculty & Instructors
                        </h2>
                        {dojo.instructors && dojo.instructors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dojo.instructors.map((inst, idx) => (
                                    <div key={idx} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl flex items-center gap-5 hover:border-white/10 transition-colors shadow-lg">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 shrink-0 overflow-hidden border border-white/5">
                                            {inst.profilePhotoUrl ? (
                                                <Image src={inst.profilePhotoUrl} alt={inst.name} width={64} height={64} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20 uppercase">
                                                    {inst.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white tracking-tight">{inst.name}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs text-zinc-500 font-medium">{inst.role}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${BELT_COLORS[inst.currentBeltRank] || "bg-zinc-700 text-white/70"}`}>
                                                    {inst.currentBeltRank?.replace(/_/g, " ")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-3xl text-center flex flex-col items-center">
                                <Users className="w-8 h-8 text-white/10 mb-3" />
                                <h3 className="font-bold text-white/80 text-sm">No Instructors Listed</h3>
                            </div>
                        )}
                    </motion.div>

                    {/* Gallery */}
                    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Branch Facility
                        </h2>
                        {dojo.gallery && dojo.gallery.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {dojo.gallery.slice(0, 6).map((photo: any, i: number) => (
                                    <div
                                        key={i}
                                        className="aspect-square rounded-3xl overflow-hidden bg-zinc-900 relative cursor-pointer group border border-white/5 shadow-lg"
                                        onClick={() => setLightboxIdx(i)}
                                    >
                                        <img
                                            src={photo.url || photo.imageUrl}
                                            alt={`Gallery ${i + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <ArrowUpRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-3xl text-center flex flex-col items-center">
                                <Camera className="w-8 h-8 text-white/10 mb-3" />
                                <h3 className="font-bold text-white/80 text-sm">No Photos Available</h3>
                            </div>
                        )}
                    </motion.div>

                    {/* Events */}
                    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Official Events
                        </h2>
                        {dojo.events && dojo.events.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {dojo.events.map((event) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="bg-[#0a0a0a] border border-white/5 hover:border-white/10 shadow-lg transition-colors p-5 rounded-3xl flex items-center gap-5 group">
                                            <div className="w-14 h-14 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center shrink-0">
                                                <span className="text-[10px] uppercase font-bold text-red-500 mb-0.5 leading-none">
                                                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-lg font-black text-white leading-none">
                                                    {new Date(event.startDate).getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{event.type}</p>
                                                <h3 className="font-bold text-white group-hover:text-[#FF9933] transition-colors tracking-tight line-clamp-1">
                                                    {event.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl text-center flex flex-col items-center shadow-lg">
                                <Calendar className="w-8 h-8 text-white/10 mb-3" />
                                <h3 className="font-bold text-white/80 text-sm">No Upcoming Events</h3>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* RIGHT SIDEBAR (Contact & Map) */}
                <div className="lg:col-span-1 space-y-6">
                    
                    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl sticky top-24">
                        <div className="bg-gradient-to-r from-[#FF9933]/10 via-white/5 to-[#138808]/10 p-4 rounded-2xl mb-6 border border-white/5">
                            <h3 className="font-black uppercase tracking-widest text-[11px] text-zinc-400 mb-2">Connect</h3>
                            
                            {dojo.contactPhone && (
                                <div className="flex items-center gap-3 mb-2">
                                    <Phone className="w-4 h-4 text-white" />
                                    <p className="text-sm font-bold tracking-wide text-white">{dojo.contactPhone}</p>
                                </div>
                            )}

                            {dojo.contactEmail && (
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-white" />
                                    <p className="text-sm text-zinc-300">{dojo.contactEmail}</p>
                                </div>
                            )}
                        </div>

                        {/* Embedded Map */}
                        <div className="w-full h-48 bg-[#050505] border border-white/5 rounded-2xl overflow-hidden relative shadow-inner mb-4">
                            <div ref={mapRef} className="w-full h-full z-0" />
                        </div>
                        
                        {(dojo.latitude && dojo.longitude) && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${dojo.latitude},${dojo.longitude}`} target="_blank" rel="noreferrer">
                                <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12 shadow-lg">
                                    <Navigation className="w-4 h-4 mr-2" /> Get Directions
                                </Button>
                            </a>
                        )}
                    </motion.div>

                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxIdx !== null && dojo.gallery.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
                        onClick={() => setLightboxIdx(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            src={dojo.gallery[lightboxIdx]?.url || dojo.gallery[lightboxIdx]?.imageUrl}
                            alt="Gallery Fullscreen"
                            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
