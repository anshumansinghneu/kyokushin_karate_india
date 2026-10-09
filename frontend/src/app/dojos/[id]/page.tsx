"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Mail, MapPin, Navigation, Phone, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getEventStatus } from "@/lib/eventStatus";
import { CITY_INDEX, normalizeCity } from "@/lib/cityCoords";
import KarateLoader from "@/components/KarateLoader";
import KankuMark from "@/components/KankuMark";
import PageHero from "@/components/brand/PageHero";
import BrandLink from "@/components/brand/BrandLink";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import 'leaflet/dist/leaflet.css';

import { dateOnlyParts } from '@/lib/dateOnly';

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
    endDate?: string | null;
    description: string;
}

interface GalleryPhoto {
    url?: string;
    imageUrl?: string;
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
    gallery: GalleryPhoto[];
    events: Event[];
}

/* Belt ranks arrive as text ("Black 2nd Dan", "BROWN", "1ST_DAN"); read the colour and any dan degree out of it. */
const KYU_SWATCH: [RegExp, string][] = [
    [/white/i, "#ffffff"],
    [/orange/i, "#f97316"],
    [/blue/i, "#3b82f6"],
    [/yellow/i, "#eab308"],
    [/green/i, "#22c55e"],
    [/brown/i, "#92400e"],
];

function beltOf(rank?: string) {
    const text = (rank ?? "").replace(/_/g, " ");
    const dan = /(\d+)\s*(st|nd|rd|th)?\s*dan/i.exec(text);
    if (dan || /black/i.test(text)) return { color: "#161616", dan: dan ? Number(dan[1]) : 0, label: text };
    const kyu = KYU_SWATCH.find(([re]) => re.test(text));
    return { color: kyu ? kyu[1] : null, dan: 0, label: text };
}

const typeLabel = (type: string) =>
    type === "BELT_EXAM" ? "Grading" : type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");

function coordsOf(dojo: Dojo): [number, number] | null {
    if (dojo.latitude && dojo.longitude) return [dojo.latitude, dojo.longitude];
    return CITY_INDEX[normalizeCity(dojo.city)] ?? null;
}

/** Directions: exact pin when we have one, otherwise let Maps search the address. */
function directionsUrl(dojo: Dojo) {
    if (dojo.latitude && dojo.longitude) return `https://www.google.com/maps/dir/?api=1&destination=${dojo.latitude},${dojo.longitude}`;
    const q = [dojo.name, dojo.address, dojo.city, dojo.state].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function InstructorRow({ inst }: { inst: Instructor }) {
    const belt = beltOf(inst.currentBeltRank);
    return (
        <li className="flex items-center gap-5 py-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
                {inst.profilePhotoUrl ? (
                    <Image src={inst.profilePhotoUrl} alt={inst.name} width={80} height={80} className="h-full w-full object-cover grayscale" />
                ) : (
                    <>
                        <KankuMark className="absolute inset-1 h-auto w-auto text-white/[0.06]" />
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-black uppercase text-white/40">
                            {inst.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                    </>
                )}
            </div>
            <div className="min-w-0">
                <p className="text-lg font-extrabold leading-tight text-white">{inst.name}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/65">
                    <span className="capitalize">{inst.role?.toLowerCase()}</span>
                    {inst.currentBeltRank && (
                        <span className="flex items-center gap-2">
                            {belt.color && (
                                <span
                                    aria-hidden="true"
                                    className={`h-2.5 w-6 rounded-sm ring-1 ${belt.dan ? "ring-secondary/70" : "ring-white/30"}`}
                                    style={{ backgroundColor: belt.color }}
                                />
                            )}
                            {belt.dan > 0 && (
                                <span aria-hidden="true" className="flex gap-0.5">
                                    {Array.from({ length: Math.min(6, belt.dan) }).map((_, i) => (
                                        <span key={i} className="h-2.5 w-0.5 bg-secondary" />
                                    ))}
                                </span>
                            )}
                            <span className={belt.dan ? "font-semibold text-secondary" : ""}>{belt.label}</span>
                        </span>
                    )}
                </p>
            </div>
        </li>
    );
}

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
        const fetchDojo = async () => {
            try {
                const response = await api.get(`/dojos/${params.id}`);
                setDojo(response.data.data.dojo);
            } catch (err: unknown) {
                const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                setError(message || "Failed to load dojo details.");
            } finally {
                setIsLoading(false);
            }
        };
        if (params.id) fetchDojo();
    }, [params.id]);

    useEffect(() => {
        if (!dojo || !mapRef.current || mapInstanceRef.current) return;
        const coords = coordsOf(dojo);
        if (!coords) return;
        const exact = Boolean(dojo.latitude && dojo.longitude);

        const initMap = async () => {
            const L = (await import('leaflet')).default;
            if (!mapRef.current || mapInstanceRef.current) return;

            const map = L.map(mapRef.current, {
                center: coords,
                // A city-level fallback should not pretend to street precision.
                zoom: exact ? 14 : 11,
                zoomControl: false,
                scrollWheelZoom: false,
                dragging: false,
            });

            // Esri Dark Gray Canvas — keyless, genuinely dark, English labels. Kept in sync with /find-a-dojo.
            L.tileLayer(
                'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                {
                    maxZoom: 16,
                    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
                },
            ).addTo(map);

            const icon = L.divIcon({
                html: `<div style="width:18px;height:18px;border-radius:50%;background:#ff0000;border:2.5px solid #fff;"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
                className: '',
            });

            L.marker(coords, { icon }).addTo(map);
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
            <div className="flex min-h-[80vh] items-center justify-center">
                <KarateLoader label="Loading dojo" />
            </div>
        );
    }

    if (error || !dojo) {
        return (
            <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-20 sm:px-6">
                <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white">
                    {error ? "We could not load this dojo" : "Dojo not found"}<span className="text-primary">.</span>
                </h1>
                <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-white/70">
                    {error && error !== "Failed to load dojo details." ? `${error}. ` : ""}
                    The requested dojo record could not be loaded. Please try again, or find another dojo.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <BrandLink href="/find-a-dojo">
                        <ArrowLeft className="h-4 w-4" /> All dojos
                    </BrandLink>
                    <BrandLink href="/dojos" variant="outline">Dojo directory</BrandLink>
                </div>
            </div>
        );
    }

    const events = [...(dojo.events ?? [])].sort((a, b) => {
        // Active (upcoming/ongoing) first, completed last; each group chronological.
        const ca = getEventStatus(a) === 'COMPLETED' ? 1 : 0;
        const cb = getEventStatus(b) === 'COMPLETED' ? 1 : 0;
        if (ca !== cb) return ca - cb;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    const photos = (dojo.gallery ?? []).slice(0, 6);
    const place = [dojo.city, dojo.state].filter(Boolean).join(", ");

    return (
        <div className="min-h-screen w-full text-white selection:bg-primary selection:text-white">
            <PageHero
                height="tall"
                kicker={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {dojo.dojoCode && <span className="font-bold text-white">{dojo.dojoCode}</span>}
                        <span>{place}</span>
                        <span className="text-white/50">Official KKFI branch</span>
                    </span>
                }
                title={<span className="block max-w-[20ch] text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.98]">{dojo.name}</span>}
                lede={dojo.address || `Official KKFI registered branch in ${place}.`}
                media={
                    <Image src="/dojo-bg.png" alt="" fill priority sizes="100vw" className="object-cover opacity-55 grayscale" />
                }
                actions={
                    <>
                        <a
                            href={directionsUrl(dojo)}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <Navigation className="h-4 w-4" aria-hidden="true" /> Get directions
                        </a>
                        {dojo.contactPhone && (
                            <a
                                href={`tel:${dojo.contactPhone}`}
                                className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
                            >
                                <Phone className="h-4 w-4" aria-hidden="true" /> Call
                            </a>
                        )}
                        {dojo.contactEmail && (
                            <a
                                href={`mailto:${dojo.contactEmail}`}
                                className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
                            >
                                <Mail className="h-4 w-4" aria-hidden="true" /> Email
                            </a>
                        )}
                    </>
                }
            >
                <Link
                    href="/find-a-dojo"
                    className="order-first mb-8 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-white/70 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All dojos
                </Link>
            </PageHero>

            <Section rhythm="base" width="wide" className="bg-black">
                <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
                    <div className="space-y-20">
                        {/* Instructors */}
                        <Reveal>
                            <Heading size="title">Instructors</Heading>
                            {dojo.instructors && dojo.instructors.length > 0 ? (
                                <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                                    {dojo.instructors.map((inst) => (
                                        <InstructorRow key={inst.id ?? inst.name} inst={inst} />
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 border-y border-white/10 py-6 text-white/65">
                                    No instructors are listed for this dojo yet. Contact KKFI for class details.
                                </p>
                            )}
                        </Reveal>

                        {/* Events */}
                        <Reveal>
                            <Heading size="title">Events</Heading>
                            {events.length > 0 ? (
                                <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                                    {events.map((event) => {
                                        const done = getEventStatus(event) === 'COMPLETED';
                                        const d = dateOnlyParts(event.startDate);
                                        return (
                                            <li key={event.id}>
                                                <Link href={`/events/${event.id}`} className="group grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-5 py-5">
                                                    <span className={`text-center ${done ? "text-white/45" : "text-white"}`}>
                                                        <span className="block text-sm font-bold">{d.month}</span>
                                                        <span className="block text-3xl font-black leading-none tabular-nums">{d.day}</span>
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-semibold text-white/55">
                                                            {typeLabel(event.type)}{done && " · Completed"}
                                                        </span>
                                                        <span className={`mt-0.5 block truncate text-lg font-extrabold transition-colors group-hover:text-primary-light ${done ? "text-white/70" : "text-white"}`}>
                                                            {event.name}
                                                        </span>
                                                    </span>
                                                    <ArrowUpRight className="h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="mt-4 border-y border-white/10 py-6 text-white/65">
                                    No events are scheduled at this dojo. See the national <Link href="/calendar" className="font-semibold text-white underline decoration-primary decoration-2 underline-offset-4">calendar</Link>.
                                </p>
                            )}
                        </Reveal>

                        {/* Facility photos: only shown when there are some. */}
                        {photos.length > 0 && (
                            <Reveal>
                                <Heading size="title">The dojo</Heading>
                                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {photos.map((photo, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setLightboxIdx(i)}
                                            aria-label={`Open photo ${i + 1}`}
                                            className={`group relative overflow-hidden rounded-lg bg-surface ${i === 0 ? "col-span-2 row-span-2 aspect-square md:col-span-2" : "aspect-square"}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photo.url || photo.imageUrl}
                                                alt=""
                                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </Reveal>
                        )}
                    </div>

                    {/* Visit: address, contact and the map, kept in view on wide screens. */}
                    <aside aria-label="Visit" className="lg:sticky lg:top-32 lg:self-start">
                        <Heading size="title">Visit</Heading>
                        <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
                            <div className="flex gap-3 py-4">
                                <dt className="sr-only">Address</dt>
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                                <dd className="leading-relaxed text-white/85">
                                    {dojo.address ? <>{dojo.address}<br /></> : null}
                                    {place}
                                </dd>
                            </div>
                            {dojo.contactPhone && (
                                <div className="flex gap-3 py-4">
                                    <dt className="sr-only">Phone</dt>
                                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                                    <dd><a href={`tel:${dojo.contactPhone}`} className="font-semibold text-white hover:text-primary-light">{dojo.contactPhone}</a></dd>
                                </div>
                            )}
                            {dojo.contactEmail && (
                                <div className="flex gap-3 py-4">
                                    <dt className="sr-only">Email</dt>
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                                    <dd className="min-w-0 break-words"><a href={`mailto:${dojo.contactEmail}`} className="text-white hover:text-primary-light">{dojo.contactEmail}</a></dd>
                                </div>
                            )}
                        </dl>

                        {coordsOf(dojo) && (
                            <div className="relative mt-6 h-56 overflow-hidden rounded-lg border border-white/10 bg-surface">
                                <div ref={mapRef} className="kkfi-dark-map z-0 h-full w-full" aria-label={`Map of ${dojo.city}`} role="img" />
                                {!(dojo.latitude && dojo.longitude) && (
                                    <p className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-6 text-xs text-white/70">
                                        Approximate: city location
                                    </p>
                                )}
                            </div>
                        )}

                        <a
                            href={directionsUrl(dojo)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
                        >
                            <Navigation className="h-4 w-4" aria-hidden="true" /> Open in Google Maps
                        </a>
                    </aside>
                </div>
            </Section>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxIdx !== null && photos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 p-4"
                        onClick={() => setLightboxIdx(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Photo"
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxIdx(null)}
                            aria-label="Close"
                            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center text-white/80 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.97, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            src={photos[lightboxIdx]?.url || photos[lightboxIdx]?.imageUrl}
                            alt=""
                            className="max-h-[90vh] max-w-full rounded-lg object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
