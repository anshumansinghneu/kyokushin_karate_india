// A member's record of representing India abroad, derived from the delegations
// they were selected for. Nothing here is stored: an "appearance" is just a
// DelegationMember row joined to a published Delegation.
//
// Two deliberate rules:
//
//  * Only published delegations count. A draft squad is an internal working
//    state and must never surface a cap on a public profile — the queries
//    filter for it, and this module filters again so a caller that forgets
//    cannot leak one.
//
//  * "Caps" means competitive appearances. Coaches and the head of delegation
//    travelled and are shown, but counting them as caps would claim they
//    competed.

export interface AppearanceRow {
    delegationId: string;
    rankAtSelection: string;
    squadRole: string;
    delegation: {
        tournamentName: string;
        hostCountry: string;
        hostCountryCode: string | null;
        hostCity: string | null;
        startDate: Date | string;
        isPublished: boolean;
    } | null;
}

export interface Appearance {
    delegationId: string;
    tournamentName: string;
    hostCountry: string;
    /** ISO 3166-1 alpha-2, uppercased, or null for pre-picker rows. */
    hostCountryCode: string | null;
    hostCity: string | null;
    startDate: string;
    /** Calendar year of the trip, read in UTC. */
    year: number;
    /** The rank held at selection — frozen, so promotion cannot rewrite it. */
    rankAtSelection: string;
    squadRole: string;
}

export interface InternationalRecord {
    /** Competitive appearances only. */
    caps: number;
    /** Every trip, in any role. */
    trips: number;
    /** Distinct host countries, most recently visited first. */
    countries: string[];
    /** Most recent trip first. */
    appearances: Appearance[];
}

export const EMPTY_RECORD: InternationalRecord = {
    caps: 0,
    trips: 0,
    countries: [],
    appearances: [],
};

export function buildInternationalRecord(rows: AppearanceRow[]): InternationalRecord {
    const appearances: Appearance[] = [];

    for (const r of rows) {
        const d = r.delegation;
        if (!d || !d.isPublished) continue;

        const start = d.startDate instanceof Date ? d.startDate : new Date(d.startDate);
        const code = d.hostCountryCode?.trim().toUpperCase() || null;

        appearances.push({
            delegationId: r.delegationId,
            tournamentName: d.tournamentName,
            hostCountry: d.hostCountry,
            hostCountryCode: code,
            hostCity: d.hostCity ?? null,
            startDate: start.toISOString(),
            // UTC: these are date-only values stored at UTC midnight, so a
            // local-time getter would report the previous year west of UTC.
            year: start.getUTCFullYear(),
            rankAtSelection: r.rankAtSelection,
            squadRole: r.squadRole,
        });
    }

    appearances.sort((a, b) => b.startDate.localeCompare(a.startDate));

    const countries: string[] = [];
    for (const a of appearances) {
        if (a.hostCountryCode && !countries.includes(a.hostCountryCode)) {
            countries.push(a.hostCountryCode);
        }
    }

    return {
        caps: appearances.filter((a) => a.squadRole === 'COMPETITOR').length,
        trips: appearances.length,
        countries,
        appearances,
    };
}
