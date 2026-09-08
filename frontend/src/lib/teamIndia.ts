// Shared types and pure helpers for Team India (international delegations).
//
// These previously lived inside `app/team-india/page.tsx`, which meant the
// homepage strip and the admin manager both imported types out of a page
// module. They live here so the page, the strip and the dashboard depend on a
// module rather than on each other's screens.

import { formatDateOnly } from './dateOnly';

export interface SquadMember {
    id: string;
    userId: string;
    name: string;
    profilePhotoUrl: string | null;
    membershipNumber: string | null;
    dojo: string | null;
    city: string | null;
    state: string | null;
    squadRole: 'LEADER' | 'COACH' | 'COMPETITOR';
    rank: string;
    rankLabel: string;
    rankKind: 'DAN' | 'COLOUR' | 'UNKNOWN';
    rankSortKey: number;
    sortOrder: number;
    title: string | null;
    /** Resolved copy: the admin's override when set, otherwise auto-generated. */
    bio: string;
    /** The raw override, so the admin editor can show what was actually typed. */
    bioOverride: string | null;
}

export interface Delegation {
    id: string;
    tournamentName: string;
    hostCountry: string;
    /** ISO 3166-1 alpha-2, or null for rows created before the picker. */
    hostCountryCode: string | null;
    hostCity: string | null;
    startDate: string;
    endDate: string | null;
    summary: string | null;
    coverImageUrl: string | null;
    isPublished: boolean;
    isFeatured: boolean;
    memberCount: number;
    members: SquadMember[];
}

/**
 * "3–7 May 2026" for a trip inside one month, "28 Apr 2026 – 3 May 2026" when
 * it straddles two, or a single date when there is no end.
 *
 * All arithmetic is UTC-pinned. These are date-only values stored as UTC
 * midnight; reading them with local getters shows the previous day to any
 * viewer west of UTC. See the note at the top of `dateOnly.ts`.
 */
export function tripDates(start: string, end: string | null): string {
    if (!end || end === start) return formatDateOnly(start);
    const s = new Date(start);
    const e = new Date(end);
    const sameMonth =
        s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth();
    return sameMonth
        ? `${s.getUTCDate()}–${formatDateOnly(end)}`
        : `${formatDateOnly(start)} – ${formatDateOnly(end)}`;
}

/**
 * Split the squad into leader(s), coaching staff, and competitor rank bands.
 *
 * Coaches are held out of the rank bands deliberately: a coach's own grade is
 * not why they travelled, so listing them under "3rd Dan" reads oddly and
 * fragments the competitor grid into near-empty rows.
 *
 * The API already returns members sorted (leader first, then most senior), so
 * this only buckets them without re-sorting. A rank that reappears after a
 * different one starts a new band rather than merging backwards — if the order
 * ever changes, the page should show what the API sent, not quietly regroup it.
 */
export function groupSquad(members: SquadMember[]) {
    const leaders = members.filter((m) => m.squadRole === 'LEADER');
    const coaches = members.filter((m) => m.squadRole === 'COACH');
    const competitors = members.filter((m) => m.squadRole === 'COMPETITOR');

    const bands: { label: string; members: SquadMember[] }[] = [];
    for (const m of competitors) {
        const label = m.rankLabel || 'Squad';
        const last = bands[bands.length - 1];
        if (last && last.label === label) last.members.push(m);
        else bands.push({ label, members: [m] });
    }
    return { leaders, coaches, bands };
}

export interface SquadStats {
    trips: number;
    /** Distinct karateka, so someone who travelled twice is counted once. */
    athletes: number;
    countries: number;
}

/**
 * Headline figures for the whole programme, derived from the delegations the
 * page already loaded — no extra request.
 *
 * `athletes` counts people rather than seats: the claim on the page is "these
 * are the karateka we have sent", so a repeat traveller must not inflate it.
 */
export function squadStats(delegations: Delegation[]): SquadStats {
    const athletes = new Set<string>();
    const countries = new Set<string>();

    for (const d of delegations) {
        for (const m of d.members) athletes.add(m.userId);
        // Prefer the ISO code: it is canonical, so two trips to the same place
        // count once even if an admin typed the name differently. Rows created
        // before the picker have no code, so fall back to the folded name.
        const country = d.hostCountryCode?.trim().toUpperCase() || d.hostCountry?.trim().toLowerCase();
        if (country) countries.add(country);
    }

    return { trips: delegations.length, athletes: athletes.size, countries: countries.size };
}
