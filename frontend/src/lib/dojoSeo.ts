/**
 * Server-side dojo data for search: city landing pages, per-dojo metadata, the
 * sitemap and their structured data. Read from the public API, cached for an hour,
 * and empty (never thrown) when the API is asleep, so a cold backend cannot fail a
 * build or a page.
 */

import { API_URL } from '@/lib/config';

/** The address the site is served from (the apex redirects here). */
export const SITE = 'https://www.kyokushinfoundation.com';

export interface PublicDojo {
    id: string;
    name: string;
    city: string;
    state?: string | null;
    country?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactPhone?: string | null;
    instructors?: { id: string; name: string; currentBeltRank?: string | null }[];
}

interface PublicInstructor {
    id: string;
    name: string;
    currentBeltRank?: string | null;
    dojo?: { name: string } | null;
}

const REVALIDATE = 3600;

async function getJson<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

/**
 * Every dojo, with its instructors. An instructor whose home dojo it is counts as
 * teaching there even before anyone links them as its teacher (as on the site).
 */
export async function getDojos(): Promise<PublicDojo[]> {
    const [dojoRes, instRes] = await Promise.all([
        getJson<{ data?: { dojos?: PublicDojo[] } }>('/dojos'),
        getJson<{ data?: { instructors?: PublicInstructor[] } }>('/users/public-instructors'),
    ]);
    const dojos = dojoRes?.data?.dojos ?? [];
    const byName = new Map(dojos.map((d) => [d.name.trim().toLowerCase(), d]));
    for (const inst of instRes?.data?.instructors ?? []) {
        const d = inst.dojo ? byName.get(inst.dojo.name.trim().toLowerCase()) : undefined;
        if (d && !(d.instructors ?? []).some((i) => i.id === inst.id)) {
            d.instructors = [...(d.instructors ?? []), { id: inst.id, name: inst.name, currentBeltRank: inst.currentBeltRank }];
        }
    }
    return dojos;
}

export async function getDojo(id: string): Promise<PublicDojo | null> {
    return (await getDojos()).find((d) => d.id === id) ?? null;
}

/**
 * For pages that must answer "not found" honestly. An empty register means the API
 * did not answer, not that nothing exists: throw so the last good page keeps being
 * served, instead of caching a 404 for a dojo or city that is really there.
 */
export async function getRegister(): Promise<PublicDojo[]> {
    const dojos = await getDojos();
    if (dojos.length === 0) throw new Error('Dojo register unavailable');
    return dojos;
}

/** "Kanpur" → "kanpur", "Navi Mumbai" → "navi-mumbai". */
export const citySlug = (city: string) =>
    city.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface CityGroup {
    slug: string;
    city: string;
    state?: string | null;
    dojos: PublicDojo[];
}

export function groupByCity(dojos: PublicDojo[]): CityGroup[] {
    const map = new Map<string, CityGroup>();
    for (const d of dojos) {
        const slug = citySlug(d.city);
        if (!slug) continue;
        const g = map.get(slug);
        if (g) g.dojos.push(d);
        else map.set(slug, { slug, city: d.city.trim(), state: d.state, dojos: [d] });
    }
    return [...map.values()].sort((a, b) => b.dojos.length - a.dojos.length || a.city.localeCompare(b.city));
}

/** Most dojos share the "Mas Oyama Karate Academy" prefix; the place is what tells them apart. */
export const shortName = (name: string) => {
    const tail = name.replace(/^mas oyama karate academy\s*[-–,]\s*/i, '').trim();
    return tail && tail.toLowerCase() !== name.trim().toLowerCase() ? tail : name.trim();
};

/** The most senior instructor's name, for titles and descriptions. */
export function chiefInstructor(d: PublicDojo): string | null {
    const order = (r?: string | null) => {
        const m = /(\d+)/.exec(r ?? '');
        return /dan|black/i.test(r ?? '') ? 100 + (m ? Number(m[1]) : 1) : 0;
    };
    const best = [...(d.instructors ?? [])].sort((a, b) => order(b.currentBeltRank) - order(a.currentBeltRank))[0];
    return best?.name.trim() ?? null;
}

/**
 * schema.org for one dojo: a sports activity location run by KKFI. Only facts the
 * register holds; no opening hours or prices (not confirmed).
 */
export function dojoJsonLd(d: PublicDojo) {
    const instructor = chiefInstructor(d);
    return {
        '@type': 'SportsActivityLocation',
        '@id': `${SITE}/dojos/${d.id}#dojo`,
        name: d.name.trim(),
        sport: 'Kyokushin Karate',
        url: `${SITE}/dojos/${d.id}`,
        parentOrganization: { '@type': 'SportsOrganization', name: 'Kyokushin Karate Foundation of India', url: SITE },
        address: {
            '@type': 'PostalAddress',
            ...(d.address ? { streetAddress: d.address.trim() } : {}),
            addressLocality: d.city.trim(),
            ...(d.state ? { addressRegion: d.state } : {}),
            addressCountry: 'IN',
        },
        ...(d.latitude && d.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: d.latitude, longitude: d.longitude } } : {}),
        ...(d.contactPhone ? { telephone: d.contactPhone } : {}),
        ...(instructor ? { employee: { '@type': 'Person', name: instructor, jobTitle: 'Instructor' } } : {}),
    };
}
