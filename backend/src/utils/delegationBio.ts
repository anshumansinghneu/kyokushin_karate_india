// Auto-generated write-up for a Team India squad member.
//
// The admin can type a bioOverride per person per trip; when they don't, this
// composes an honest line from what the member's record actually holds. It
// deliberately claims nothing it cannot support — the tournament-results tables
// are empty, so there is no "national champion" to draw on.

import { parseRank } from './rank';

export interface BioSource {
    rankAtSelection?: string | null;
    dojoName?: string | null;
    city?: string | null;
    state?: string | null;
    experienceYears?: number | null;
    experienceMonths?: number | null;
}

const trimmed = (v?: string | null): string => (v ?? '').trim();

/** "8 years", "8 years 6 months", "6 months", or "" when nothing is recorded. */
export function formatExperience(years?: number | null, months?: number | null): string {
    const y = Math.max(0, Math.floor(years ?? 0));
    const m = Math.max(0, Math.floor(months ?? 0));
    const parts: string[] = [];
    if (y > 0) parts.push(`${y} year${y === 1 ? '' : 's'}`);
    if (m > 0) parts.push(`${m} month${m === 1 ? '' : 's'}`);
    return parts.join(' ');
}

/**
 * Compose the fallback bio. Segments that have no data are dropped rather than
 * rendered empty, so a sparse record still reads as a sentence instead of
 * "· · ·".
 */
export function buildAutoBio(source: BioSource): string {
    const segments: string[] = [];

    const rank = parseRank(source.rankAtSelection);
    if (rank.label) segments.push(rank.label);

    // Prefer the dojo; fall back to the member's own city so there is always
    // some sense of where they train.
    const dojo = trimmed(source.dojoName);
    const place = [trimmed(source.city), trimmed(source.state)].filter(Boolean).join(', ');
    if (dojo) {
        segments.push(place && !dojo.includes(place) ? `${dojo}, ${place}` : dojo);
    } else if (place) {
        segments.push(place);
    }

    const experience = formatExperience(source.experienceYears, source.experienceMonths);
    if (experience) segments.push(`${experience} training`);

    return segments.join(' · ');
}

/** The override when present, otherwise the generated line. */
export function resolveBio(override: string | null | undefined, source: BioSource): string {
    const manual = trimmed(override);
    return manual || buildAutoBio(source);
}
