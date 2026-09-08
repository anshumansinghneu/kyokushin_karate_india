import { describe, it, expect } from 'vitest';
import {
    tripDates,
    groupSquad,
    squadStats,
    type Delegation,
    type SquadMember,
} from './teamIndia';

/* ─── Fixtures ───────────────────────────────────────────── */

let seq = 0;

function member(overrides: Partial<SquadMember> = {}): SquadMember {
    seq += 1;
    return {
        id: `m${seq}`,
        userId: `u${seq}`,
        name: `Member ${seq}`,
        profilePhotoUrl: null,
        membershipNumber: null,
        dojo: null,
        city: null,
        state: null,
        squadRole: 'COMPETITOR',
        rank: '1st Dan',
        rankLabel: '1st Dan',
        rankKind: 'DAN',
        rankSortKey: 100,
        sortOrder: 0,
        title: null,
        bio: '',
        bioOverride: null,
        ...overrides,
    };
}

function delegation(overrides: Partial<Delegation> = {}): Delegation {
    return {
        id: 'd1',
        tournamentName: 'Test Cup',
        hostCountry: 'Japan',
        hostCountryCode: 'JP',
        hostCity: 'Tokyo',
        startDate: '2026-05-03T00:00:00.000Z',
        endDate: null,
        summary: null,
        coverImageUrl: null,
        isPublished: true,
        isFeatured: false,
        memberCount: 0,
        members: [],
        ...overrides,
    };
}

/* ─── tripDates ──────────────────────────────────────────── */

describe('tripDates', () => {
    it('collapses a same-month range to one month and year', () => {
        expect(tripDates('2026-05-03T00:00:00.000Z', '2026-05-07T00:00:00.000Z')).toBe('3–7 May 2026');
    });

    it('spells out both sides when the range crosses a month', () => {
        expect(tripDates('2026-04-28T00:00:00.000Z', '2026-05-03T00:00:00.000Z')).toBe(
            '28 Apr 2026 – 3 May 2026',
        );
    });

    it('spells out both sides when the range crosses a year', () => {
        // Same month number (December vs December) but different years must NOT
        // collapse to "28–3 Dec".
        expect(tripDates('2025-12-28T00:00:00.000Z', '2026-12-03T00:00:00.000Z')).toBe(
            '28 Dec 2025 – 3 Dec 2026',
        );
    });

    it('renders a single date when there is no end', () => {
        expect(tripDates('2026-05-03T00:00:00.000Z', null)).toBe('3 May 2026');
    });

    it('renders a single date when the end repeats the start', () => {
        expect(tripDates('2026-05-03T00:00:00.000Z', '2026-05-03T00:00:00.000Z')).toBe('3 May 2026');
    });

    it('reads the stored calendar day, not the viewer-local one', () => {
        // Same class of bug as dateOnly: UTC midnight read with local getters
        // shows the previous day for any viewer west of UTC.
        expect(tripDates('2026-05-01T00:00:00.000Z', null)).toBe('1 May 2026');
    });
});

/* ─── groupSquad ─────────────────────────────────────────── */

describe('groupSquad', () => {
    it('separates leaders from the rest', () => {
        const lead = member({ squadRole: 'LEADER', rankLabel: '5th Dan' });
        const comp = member({ squadRole: 'COMPETITOR', rankLabel: '1st Dan' });
        const { leaders, bands } = groupSquad([lead, comp]);
        expect(leaders).toHaveLength(1);
        expect(leaders[0].id).toBe(lead.id);
        expect(bands).toHaveLength(1);
        expect(bands[0].members[0].id).toBe(comp.id);
    });

    it('groups coaches on their own, not inside a rank band', () => {
        // A coach's rank is not why they travelled, so filing them under "3rd
        // Dan" both reads oddly and fragments the competitor grid.
        const coach = member({ squadRole: 'COACH', rankLabel: '3rd Dan' });
        const comp = member({ squadRole: 'COMPETITOR', rankLabel: '1st Dan' });
        const { coaches, bands } = groupSquad([coach, comp]);
        expect(coaches.map((c) => c.id)).toEqual([coach.id]);
        expect(bands).toHaveLength(1);
        expect(bands[0].label).toBe('1st Dan');
    });

    it('buckets consecutive members sharing a rank label into one band', () => {
        const a = member({ rankLabel: '2nd Dan' });
        const b = member({ rankLabel: '2nd Dan' });
        const c = member({ rankLabel: '1st Dan' });
        const { bands } = groupSquad([a, b, c]);
        expect(bands.map((x) => [x.label, x.members.length])).toEqual([
            ['2nd Dan', 2],
            ['1st Dan', 1],
        ]);
    });

    it('does not merge a rank that recurs after another rank', () => {
        // The API sorts by seniority, so a repeat means the ordering changed;
        // preserve it rather than silently regrouping.
        const { bands } = groupSquad([
            member({ rankLabel: '2nd Dan' }),
            member({ rankLabel: '1st Dan' }),
            member({ rankLabel: '2nd Dan' }),
        ]);
        expect(bands.map((x) => x.label)).toEqual(['2nd Dan', '1st Dan', '2nd Dan']);
    });

    it('falls back to a generic band label when a rank label is empty', () => {
        const { bands } = groupSquad([member({ rankLabel: '' })]);
        expect(bands[0].label).toBe('Squad');
    });

    it('does not treat a coach as a leader', () => {
        const { leaders, coaches, bands } = groupSquad([member({ squadRole: 'COACH' })]);
        expect(leaders).toHaveLength(0);
        expect(coaches).toHaveLength(1);
        expect(bands).toHaveLength(0);
    });

    it('returns empty structures for an empty squad', () => {
        expect(groupSquad([])).toEqual({ leaders: [], coaches: [], bands: [] });
    });
});

/* ─── squadStats ─────────────────────────────────────────── */

describe('squadStats', () => {
    it('counts trips, unique athletes and unique countries', () => {
        const stats = squadStats([
            delegation({ id: 'a', hostCountry: 'Japan', hostCountryCode: 'JP', members: [member(), member()] }),
            delegation({ id: 'b', hostCountry: 'Russia', hostCountryCode: 'RU', members: [member()] }),
        ]);
        expect(stats).toEqual({ trips: 2, athletes: 3, countries: 2 });
    });

    it('counts a karateka who travelled twice as one athlete', () => {
        // The headline is "athletes we have sent", not "seats filled".
        const repeat = member({ userId: 'shared' });
        const stats = squadStats([
            delegation({ id: 'a', members: [repeat] }),
            delegation({ id: 'b', members: [member({ userId: 'shared' })] }),
        ]);
        expect(stats.athletes).toBe(1);
        expect(stats.trips).toBe(2);
    });

    it('treats the same country written differently as one country', () => {
        const stats = squadStats([
            delegation({ id: 'a', hostCountry: 'Japan', hostCountryCode: null }),
            delegation({ id: 'b', hostCountry: ' japan ', hostCountryCode: null }),
        ]);
        expect(stats.countries).toBe(1);
    });

    it('counts by ISO code when one is present', () => {
        // Two trips to Japan, one row labelled "Nippon" by an admin. The code
        // is canonical, so this is still one country.
        const stats = squadStats([
            delegation({ id: 'a', hostCountry: 'Japan', hostCountryCode: 'JP' }),
            delegation({ id: 'b', hostCountry: 'Nippon', hostCountryCode: 'JP' }),
        ]);
        expect(stats.countries).toBe(1);
    });

    it('still counts a row that predates the picker', () => {
        const stats = squadStats([
            delegation({ id: 'a', hostCountry: 'Japan', hostCountryCode: 'JP' }),
            delegation({ id: 'b', hostCountry: 'Russia', hostCountryCode: null }),
        ]);
        expect(stats.countries).toBe(2);
    });

    it('ignores a blank country rather than counting it', () => {
        const stats = squadStats([delegation({ hostCountry: '   ', hostCountryCode: null })]);
        expect(stats.countries).toBe(0);
    });

    it('returns zeros for no delegations', () => {
        expect(squadStats([])).toEqual({ trips: 0, athletes: 0, countries: 0 });
    });
});
