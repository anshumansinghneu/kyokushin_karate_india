"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, RefreshCw, Search, X } from "lucide-react";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import PageHero from "@/components/brand/PageHero";
import BrandLink from "@/components/brand/BrandLink";
import SceneSlot from "@/components/three/SceneSlot";
import { CITY_INDEX, normalizeCity } from "@/lib/cityCoords";

interface DojoInstructor {
    name?: string;
    currentBeltRank?: string;
}

interface Dojo {
    id: string;
    name: string;
    dojoCode?: string;
    city: string;
    state?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    chiefInstructor?: string | null;
    instructors?: DojoInstructor[];
}

const instructorOf = (d: Dojo) => d.chiefInstructor || d.instructors?.find((i) => i.name)?.name || null;

/** Dojos grouped by state, states and dojos in alphabetical order. */
function byState(dojos: Dojo[]) {
    const groups = new Map<string, Dojo[]>();
    for (const d of dojos) {
        const key = d.state?.trim() || "Other";
        groups.set(key, [...(groups.get(key) ?? []), d]);
    }
    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([state, list]) => ({ state, list: list.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)) }));
}

function DojoRow({ dojo }: { dojo: Dojo }) {
    const instructor = instructorOf(dojo);
    return (
        <li>
            <Link
                href={`/dojos/${dojo.id}`}
                className="group grid gap-x-8 gap-y-1.5 py-6 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-baseline"
            >
                <span className="text-sm font-bold text-white/60">{dojo.city}</span>
                <span className="min-w-0">
                    <span className="block text-pretty text-lg font-extrabold leading-snug text-white transition-colors group-hover:text-primary-light">
                        {dojo.name}
                    </span>
                    {(dojo.address || instructor) && (
                        <span className="mt-1.5 flex flex-col gap-1 text-sm text-white/65 md:flex-row md:gap-6">
                            {dojo.address && (
                                <span className="flex min-w-0 items-start gap-1.5">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span>{dojo.address}</span>
                                </span>
                            )}
                            {instructor && <span className="shrink-0">Instructor: <span className="font-semibold text-white/85">{instructor}</span></span>}
                        </span>
                    )}
                </span>
                <ArrowUpRight
                    className="hidden h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white sm:block"
                    aria-hidden="true"
                />
            </Link>
        </li>
    );
}

export default function DojoListPage() {
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchDojos = async () => {
        setIsLoading(true);
        setError(false);
        try {
            const response = await api.get("/dojos");
            setDojos(response.data.data.dojos);
        } catch (err) {
            console.error("Failed to fetch dojos", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Deferred a frame so the fetch's state updates don't run synchronously inside the effect.
        const id = requestAnimationFrame(() => {
            void fetchDojos();
        });
        return () => cancelAnimationFrame(id);
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return dojos;
        return dojos.filter((dojo) =>
            [dojo.name, dojo.city, dojo.state, dojo.address, instructorOf(dojo)].some((v) => v?.toLowerCase().includes(q)),
        );
    }, [dojos, searchQuery]);

    const groups = useMemo(() => byState(filtered), [filtered]);
    const cities = useMemo(() => new Set(dojos.map((d) => d.city.trim().toLowerCase())).size, [dojos]);

    // One beam per city with a dojo; taller where there are more.
    const mapScene = useMemo(() => {
        const byCity = new Map<string, { key: string; lat: number; lon: number; count: number }>();
        for (const d of dojos) {
            const coords = d.latitude && d.longitude ? ([d.latitude, d.longitude] as [number, number]) : CITY_INDEX[normalizeCity(d.city)];
            if (!coords) continue;
            const key = normalizeCity(d.city) || coords.join(",");
            const g = byCity.get(key);
            if (g) g.count += 1;
            else byCity.set(key, { key, lat: coords[0], lon: coords[1], count: 1 });
        }
        return { cities: [...byCity.values()], focus: null };
    }, [dojos]);

    return (
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            <PageHero
                height="compact"
                className="max-md:min-h-[88svh] md:min-h-[64svh]"
                title={<>The dojo<br />directory<span className="text-primary">.</span></>}
                lede={
                    isLoading
                        ? "Begin your journey. Locate the nearest Kyokushin Karate dojo and forge your spirit."
                        : error
                          ? "Begin your journey. Locate the nearest Kyokushin Karate dojo and forge your spirit."
                          : `${dojos.length} official KKFI ${dojos.length === 1 ? "dojo" : "dojos"} in ${cities} ${cities === 1 ? "city" : "cities"}. Begin your journey: locate the nearest one and forge your spirit.`
                }
                media={
                    <SceneSlot
                        scene="india-map"
                        sceneProps={mapScene}
                        className="absolute inset-x-0 top-0 h-[50%] md:inset-0 md:h-auto"
                        fallback={
                            <div className="absolute inset-0 bg-black">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/geo/india-poster.svg" alt="" className="absolute left-1/2 top-[6%] h-[88%] -translate-x-1/2 opacity-60 md:left-auto md:right-[8%] md:translate-x-0" />
                            </div>
                        }
                    />
                }
                actions={
                    <BrandLink href="/find-a-dojo" variant="outline">
                        Open the 3D map <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </BrandLink>
                }
            />

            <div className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:px-8">
                {/* Search: an underline field, sticky under the navbar while the list scrolls. */}
                <div className="sticky top-16 z-10 -mx-4 bg-black px-4 pb-4 pt-6 sm:-mx-6 sm:px-6 md:top-28 lg:-mx-8 lg:px-8">
                    <label htmlFor="dojo-search" className="sr-only">
                        Search dojos
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" aria-hidden="true" />
                        <input
                            id="dojo-search"
                            type="search"
                            placeholder="City, dojo or instructor"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 w-full rounded-none border-0 border-b-2 border-white/20 bg-transparent pl-9 pr-10 text-lg text-white placeholder:text-white/55 focus:border-primary focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:hidden"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                aria-label="Clear search"
                                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/60 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    {!isLoading && !error && (
                        <p className="mt-3 text-sm text-white/60" aria-live="polite">
                            {searchQuery ? `${filtered.length} of ${dojos.length} dojos` : `${dojos.length} dojos`}
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex h-[40vh] items-center justify-center">
                        <KarateLoader label="Loading dojos" />
                    </div>
                ) : error ? (
                    <div className="py-20">
                        <p className="text-xl font-extrabold text-white">We could not load the dojo list.</p>
                        <p className="mt-2 text-white/65">The server did not respond. Try again in a moment.</p>
                        <button
                            type="button"
                            onClick={fetchDojos}
                            className="mt-6 inline-flex min-h-12 items-center gap-2 bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20">
                        <p className="text-xl font-extrabold text-white">No dojo matches &ldquo;{searchQuery}&rdquo;.</p>
                        <p className="mt-2 text-white/65">Try a nearby city or the state name, or see every dojo on the map.</p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="inline-flex min-h-12 items-center justify-center border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10"
                            >
                                Clear search
                            </button>
                            <BrandLink href="/find-a-dojo">Open the map</BrandLink>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 space-y-14">
                        {groups.map(({ state, list }) => (
                            <section key={state} aria-labelledby={`state-${state}`}>
                                <h2 id={`state-${state}`} className="flex items-baseline justify-between border-b border-white/20 pb-3 text-xl font-extrabold text-white">
                                    {state}
                                    <span className="text-sm font-semibold text-white/55">
                                        {list.length} {list.length === 1 ? "dojo" : "dojos"}
                                    </span>
                                </h2>
                                <ul className="divide-y divide-white/10">
                                    {list.map((dojo) => (
                                        <DojoRow key={dojo.id} dojo={dojo} />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
