// A member's record of representing India abroad, as returned by the API.
//
// The wording rules live here rather than in the components so the public
// profile and the member's own profile cannot describe the same record
// differently.

export interface Appearance {
    delegationId: string;
    tournamentName: string;
    hostCountry: string;
    hostCountryCode: string | null;
    hostCity: string | null;
    startDate: string;
    year: number;
    /** The rank held on that trip, frozen at selection. */
    rankAtSelection: string;
    squadRole: 'LEADER' | 'COACH' | 'COMPETITOR' | string;
}

export interface InternationalRecord {
    /** Competitive appearances only. */
    caps: number;
    /** Every trip, in any role. */
    trips: number;
    countries: string[];
    appearances: Appearance[];
}

export const EMPTY_INTERNATIONAL: InternationalRecord = {
    caps: 0,
    trips: 0,
    countries: [],
    appearances: [],
};

/** True when there is anything at all worth showing. */
export function hasInternational(record: InternationalRecord | null | undefined): boolean {
    return !!record && record.trips > 0;
}

/**
 * The text on the gold chip.
 *
 * Someone who only ever travelled as a coach or head of delegation has no
 * caps, and calling them capped would claim they competed. They are still
 * shown — as an official.
 */
export function capsLabel(record: InternationalRecord): string {
    if (record.caps > 0) return `${record.caps} ${record.caps === 1 ? 'cap' : 'caps'}`;
    return 'Delegation official';
}

export function roleLabel(squadRole: string): string {
    if (squadRole === 'LEADER') return 'Head of Delegation';
    if (squadRole === 'COACH') return 'Coach';
    return 'Competitor';
}

/**
 * "Tokyo, Japan" — or just the country when no city was recorded.
 */
export function appearancePlace(a: Appearance): string {
    return [a.hostCity, a.hostCountry].filter(Boolean).join(', ');
}

/** Coerces whatever the API returned into a usable record. */
export function readInternational(value: unknown): InternationalRecord {
    const r = value as Partial<InternationalRecord> | null | undefined;
    if (!r || typeof r !== 'object') return EMPTY_INTERNATIONAL;
    return {
        caps: typeof r.caps === 'number' ? r.caps : 0,
        trips: typeof r.trips === 'number' ? r.trips : 0,
        countries: Array.isArray(r.countries) ? r.countries : [],
        appearances: Array.isArray(r.appearances) ? r.appearances : [],
    };
}
