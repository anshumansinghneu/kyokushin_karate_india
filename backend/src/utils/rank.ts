// Ordering for belt ranks.
//
// This project stores rank as a display string, not a number — the vocabulary
// is BELT_RANKS in the frontend: "White", "Orange", "Blue", "Yellow", "Green",
// "Brown", then "Black 1st Dan" ... "Black 10th Dan". There are no kyu numbers.
//
// Sorting a squad by seniority therefore needs a parser rather than a numeric
// column. Two traps it has to avoid:
//   * "Black 10th Dan" must outrank "Black 2nd Dan" — a lexical sort puts "10"
//     before "2".
//   * The colour order is a Kyokushin progression, not alphabetical and not the
//     rainbow: White is the most junior and Brown the most senior.

/** Colour belts, most junior first. Index doubles as the seniority score. */
export const COLOUR_BELTS = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown'] as const;

export type RankKind = 'DAN' | 'COLOUR' | 'UNKNOWN';

export interface ParsedRank {
    kind: RankKind;
    /** Dan number for black belts (1-10); 0 otherwise. */
    dan: number;
    /**
     * Higher is more senior, across the whole system:
     *   Black 10th Dan = 110 … Black 1st Dan = 101
     *   Brown = 6 … White = 1
     *   Unrecognised = 0
     */
    sortKey: number;
    /** Canonical display label, e.g. "3rd Dan" or "Brown". */
    label: string;
}

const DAN_PATTERN = /(\d{1,2})\s*(?:st|nd|rd|th)?\s*dan/i;

const ordinal = (n: number): string => {
    // 11th-13th are the usual exceptions, though dan only reaches 10.
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
    }
};

export function parseRank(raw: string | null | undefined): ParsedRank {
    const value = (raw ?? '').trim();
    if (!value) return { kind: 'UNKNOWN', dan: 0, sortKey: 0, label: '' };

    // Dan grades. Matches "Black 3rd Dan", "3rd Dan", "3 dan".
    const danMatch = value.match(DAN_PATTERN);
    if (danMatch) {
        const dan = parseInt(danMatch[1], 10);
        if (dan >= 1 && dan <= 10) {
            return { kind: 'DAN', dan, sortKey: 100 + dan, label: `${ordinal(dan)} Dan` };
        }
    }

    // Colour belts, matched on the colour word so "Brown Belt" also resolves.
    const lower = value.toLowerCase();
    for (let i = COLOUR_BELTS.length - 1; i >= 0; i--) {
        const colour = COLOUR_BELTS[i];
        if (lower.includes(colour.toLowerCase())) {
            return { kind: 'COLOUR', dan: 0, sortKey: i + 1, label: colour };
        }
    }

    return { kind: 'UNKNOWN', dan: 0, sortKey: 0, label: value };
}

/**
 * Traditional title for a dan grade, matching the /black-belts page.
 * Colour belts have no title.
 */
export function rankTitle(rank: string | null | undefined): string | null {
    const { kind, dan } = parseRank(rank);
    if (kind !== 'DAN') return null;
    if (dan >= 5) return 'SHIHAN';
    if (dan >= 3) return 'SENSEI';
    return 'SENPAI';
}

/**
 * Comparator ordering the most senior first. Ties fall back to name so the
 * output is stable rather than dependent on insertion order.
 */
export function bySeniority<T extends { rankAtSelection?: string | null; name?: string | null }>(
    a: T,
    b: T
): number {
    const diff = parseRank(b.rankAtSelection).sortKey - parseRank(a.rankAtSelection).sortKey;
    if (diff !== 0) return diff;
    return (a.name ?? '').localeCompare(b.name ?? '');
}
