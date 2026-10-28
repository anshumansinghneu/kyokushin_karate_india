"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Mail, MapPin, Navigation, Phone, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getEventStatus } from "@/lib/eventStatus";
import { CITY_INDEX, normalizeCity } from "@/lib/cityCoords";
import KarateLoader from "@/components/KarateLoader";
import RankPortrait from "@/components/people/RankPortrait";
import { getImageUrl, sizedImageUrl } from "@/lib/imageUtils";
import PageHero from "@/components/brand/PageHero";
import BrandLink from "@/components/brand/BrandLink";
import SceneSlot from "@/components/three/SceneSlot";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import 'leaflet/dist/leaflet.css';

import { dateOnlyParts } from '@/lib/dateOnly';

/* ── Interfaces ── */
interface Instructor {
    id: string;
    name: string;
    role: string;
    currentBeltRank: string;
    profilePhotoUrl: string | null;
    membershipNumber?: string | null;
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
    id?: string;
    url?: string;
    imageUrl?: string;
    caption?: string | null;
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
    /** Active members registered at this dojo (absent from older API builds). */
    memberCount?: number;
}

interface DojoSummary {
    id: string;
    name: string;
    city: string;
    state?: string;
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

export default function DojoDetailPage() {
    const params = useParams();
    const [dojo, setDojo] = useState<Dojo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [allDojos, setAllDojos] = useState<DojoSummary[]>([]);

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

    // The register, for "other dojos in this city".
    useEffect(() => {
        api.get('/dojos').then((res) => setAllDojos(res.data.data.dojos ?? [])).catch(() => {});
    }, []);

    // Instructors registered at this dojo as their home dojo teach here too, even before
    // anyone links them as its teacher; add any the dojo record does not already list.
    const [homeInstructors, setHomeInstructors] = useState<Instructor[]>([]);
    useEffect(() => {
        if (!dojo) return;
        api.get('/users/public-instructors')
            .then((res) => {
                const name = dojo.name.trim().toLowerCase();
                const listed = new Set((dojo.instructors ?? []).map((i) => i.id));
                const extra = ((res.data?.data?.instructors ?? []) as (Instructor & { dojo?: { name: string } | null })[])
                    .filter((i) => i.dojo?.name.trim().toLowerCase() === name && !listed.has(i.id));
                setHomeInstructors(extra);
            })
            .catch(() => {});
    }, [dojo]);

    // The hero map holds on this dojo's city, its beam red.
    const mapScene = useMemo(() => {
        const coords = dojo ? coordsOf(dojo) : null;
        if (!coords) return null;
        return { cities: [{ key: "here", lat: coords[0], lon: coords[1], count: 2 }], focus: "here", focusDistance: 1.8, drift: true };
    }, [dojo]);

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
                html: `<div style="width:18px;height:18px;border-radius:50%;background:#B3261E;border:2.5px solid #fff;"></div>`,
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
    const photos = (dojo.gallery ?? []).slice(0, 12);
    const photoSrc = (p: GalleryPhoto) => p.url || p.imageUrl || null;
    const place = [dojo.city, dojo.state].filter(Boolean).join(", ");
    const instructors = [...(dojo.instructors ?? []), ...homeInstructors];
    const upcoming = events.filter((e) => getEventStatus(e) !== 'COMPLETED').length;
    const neighbours = allDojos.filter((d) => d.id !== dojo.id && normalizeCity(d.city) === normalizeCity(dojo.city));
    // Live facts only: anything we do not have is left out rather than shown as zero.
    const facts = [
        dojo.memberCount ? { value: dojo.memberCount, label: dojo.memberCount === 1 ? "active member" : "active members" } : null,
        instructors.length ? { value: instructors.length, label: instructors.length === 1 ? "instructor" : "instructors" } : null,
        upcoming ? { value: upcoming, label: upcoming === 1 ? "upcoming event" : "upcoming events" } : null,
    ].filter(Boolean) as { value: number; label: string }[];

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
                className="max-md:min-h-[100svh]"
                media={
                    mapScene ? (
                        <SceneSlot
                            scene="india-map"
                            sceneProps={mapScene}
                            className="absolute inset-x-0 top-0 h-[42%] md:inset-0 md:h-auto"
                            fallback={
                                <div className="absolute inset-0 bg-black">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/geo/india-poster.svg" alt="" className="absolute left-1/2 top-[6%] h-[88%] -translate-x-1/2 opacity-60 md:left-auto md:right-[8%] md:translate-x-0" />
                                </div>
                            }
                        />
                    ) : (
 <Image src="/history/solitude.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-55 " />
                    )
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

            {facts.length > 0 && (
                <Section rhythm="tight" width="wide" className="bg-black pb-0">
                    <dl className="grid grid-cols-2 gap-y-8 border-y border-white/10 py-8 sm:flex sm:gap-x-16">
                        {facts.map((f) => (
                            <div key={f.label}>
                                <dt className="sr-only">{f.label}</dt>
                                <dd>
                                    <span className="block font-mincho text-[clamp(2.25rem,4vw,3.25rem)] font-extrabold leading-none tabular-nums text-white">{f.value}</span>
                                    <span className="mt-2 block text-sm font-semibold text-white/60">{f.label}</span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Section>
            )}

            <Section rhythm="base" width="wide" className="bg-black">
                <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
                    <div className="space-y-20">
                        {/* Instructors */}
                        <Reveal>
                            <Heading size="title">Instructors</Heading>
                            {instructors.length > 0 ? (
                                <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                                    {instructors.map((inst) => (
                                        <li key={inst.id ?? inst.name}>
                                            <RankPortrait
                                                name={inst.name}
                                                rank={inst.currentBeltRank}
                                                photoUrl={getImageUrl(inst.profilePhotoUrl)}
                                                detail={dojo.name}
                                                location={place || undefined}
                                                verifyHref={inst.membershipNumber ? `/verify/${encodeURIComponent(inst.membershipNumber)}` : undefined}
                                            />
                                        </li>
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
                                            key={photo.id ?? i}
                                            type="button"
                                            onClick={() => setLightboxIdx(i)}
                                            aria-label={photo.caption ? `Open photo: ${photo.caption}` : `Open photo ${i + 1}`}
                                            className={`group relative overflow-hidden rounded-lg bg-surface ${i === 0 ? "col-span-2 row-span-2 aspect-square md:col-span-2" : "aspect-square"}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={sizedImageUrl(photoSrc(photo), i === 0 ? 700 : 340) ?? undefined}
                                                alt=""
                                                loading="lazy"
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

            {/* Train here: straight into registration with this dojo already chosen. */}
            <Section rhythm="open" width="wide" className="overflow-hidden bg-black">
                <Reveal kind="mask" duration={1.1}>
                    <p className="max-w-[18ch] text-balance font-mincho text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-white">
                        Train here<span className="text-primary">.</span>
                    </p>
                </Reveal>
                <Reveal delay={0.1} className="mt-6 max-w-[52ch] text-pretty text-lg leading-relaxed text-white/75">
                    <p>
                        Join KKFI with {dojo.name} as your dojo. Your instructor approves the membership, and your belt
                        record starts on the national register.
                    </p>
                </Reveal>
                <Reveal delay={0.15} className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <BrandLink href={`/register?dojo=${encodeURIComponent(dojo.id)}`}>
                        Join at this dojo <ArrowUpRight className="h-4 w-4" />
                    </BrandLink>
                    <a
                        href={directionsUrl(dojo)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
                    >
                        <Navigation className="h-4 w-4" aria-hidden="true" /> Visit a class
                    </a>
                </Reveal>
            </Section>

            {neighbours.length > 0 && (
                <Section rhythm="tight" width="wide" className="bg-black">
                    <Heading size="title">Other dojos in {dojo.city}</Heading>
                    <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                        {neighbours.map((d) => (
                            <li key={d.id}>
                                <Link href={`/dojos/${d.id}`} className="group flex items-center justify-between gap-6 py-5">
                                    <span className="min-w-0">
                                        <span className="block truncate text-lg font-extrabold text-white transition-colors group-hover:text-primary-light">{d.name}</span>
                                        <span className="mt-0.5 block text-sm text-white/55">{[d.city, d.state].filter(Boolean).join(", ")}</span>
                                    </span>
                                    <ArrowUpRight className="h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

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
                            src={getImageUrl(photoSrc(photos[lightboxIdx])) ?? undefined}
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
