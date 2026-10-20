"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CITY_COORDS } from "@/lib/cityCoords";

type Ring = [number, number][];
interface Dojo {
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

/**
 * India with a dan-gold dot for each city that has a KKFI dojo, larger where
 * there are more. The outline is India's official boundary per the Survey of
 * India (public/geo/india.json, from datameet), not generic world-map data.
 * Dojos without their own coordinates fall back to their city's.
 */
export default function IndiaDojoMap({ fallback }: { fallback: React.ReactNode }) {
    const [rings, setRings] = useState<Ring[] | null>(null);
    const [cities, setCities] = useState<{ name: string; lat: number; lon: number; n: number }[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        // The outline is local and fast; the dojos come from the API and may take a while.
        fetch("/geo/india.json")
            .then((r) => r.json() as Promise<{ rings: Ring[] }>)
            .then((geo) => alive && setRings(geo.rings))
            .catch(() => alive && setFailed(true));
        api.get("/dojos", { params: { limit: 500 } })
            .then((res) => {
                if (!alive) return;
                const byCity = new Map<string, { name: string; lat: number; lon: number; n: number }>();
                for (const d of (res.data.data.dojos ?? []) as Dojo[]) {
                    const key = (d.city ?? "").trim().toLowerCase();
                    const at = d.latitude && d.longitude ? [d.latitude, d.longitude] : CITY_COORDS[key];
                    if (!at) continue;
                    const prev = byCity.get(key);
                    if (prev) prev.n++;
                    else byCity.set(key, { name: d.city!.trim(), lat: at[0], lon: at[1], n: 1 });
                }
                setCities([...byCity.values()]);
            })
            .catch(() => alive && setFailed(true));
        return () => {
            alive = false;
        };
    }, []);

    if (failed || (cities && cities.length === 0)) return <>{fallback}</>;
    if (!rings) return <div className="absolute inset-0 bg-night" />;

    // Equirectangular, squeezed by cos(latitude) so India keeps its shape.
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const ring of rings) for (const [lon, lat] of ring) {
        minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
    const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const x = (lon: number) => (lon - minLon) * k;
    const y = (lat: number) => maxLat - lat;
    const d = rings.map((r) => "M" + r.map(([lon, lat]) => `${x(lon).toFixed(2)},${y(lat).toFixed(2)}`).join("L") + "Z").join("");
    const dots = cities ?? [];
    const total = dots.reduce((s, c) => s + c.n, 0);

    return (
        <svg
            viewBox={`-1 -1 ${(maxLon - minLon) * k + 2} ${maxLat - minLat + 2}`}
            role="img"
            aria-label={cities ? `Map of India: ${total} KKFI dojos in ${dots.map((c) => c.name).join(", ")}` : "Map of India"}
            className="absolute inset-[8%] h-[84%] w-[84%]"
        >
            <path d={d} className="fill-worn-belt" />
            {dots.map((c) => (
                <circle key={c.name} cx={x(c.lon)} cy={y(c.lat)} r={0.35 + Math.sqrt(c.n) * 0.18} className="fill-dan-gold" />
            ))}
        </svg>
    );
}
