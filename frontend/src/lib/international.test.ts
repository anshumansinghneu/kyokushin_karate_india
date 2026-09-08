import { describe, it, expect } from 'vitest';
import {
    EMPTY_INTERNATIONAL,
    appearancePlace,
    capsLabel,
    hasInternational,
    readInternational,
    roleLabel,
    type Appearance,
} from './international';

const app = (over: Partial<Appearance> = {}): Appearance => ({
    delegationId: 'd1',
    tournamentName: 'Test Cup',
    hostCountry: 'Japan',
    hostCountryCode: 'JP',
    hostCity: 'Tokyo',
    startDate: '2026-11-01T00:00:00.000Z',
    year: 2026,
    rankAtSelection: '1st Dan',
    squadRole: 'COMPETITOR',
    ...over,
});

const record = (over: Partial<typeof EMPTY_INTERNATIONAL> = {}) => ({
    ...EMPTY_INTERNATIONAL,
    ...over,
});

describe('hasInternational', () => {
    it('is false for nothing, null or an empty record', () => {
        expect(hasInternational(null)).toBe(false);
        expect(hasInternational(undefined)).toBe(false);
        expect(hasInternational(EMPTY_INTERNATIONAL)).toBe(false);
    });

    it('is true once there is a trip, even with no caps', () => {
        // A coach-only record must still show; it just is not "capped".
        expect(hasInternational(record({ trips: 1, caps: 0 }))).toBe(true);
    });
});

describe('capsLabel', () => {
    it('singularises one cap', () => {
        expect(capsLabel(record({ caps: 1, trips: 1 }))).toBe('1 cap');
    });

    it('pluralises more than one', () => {
        expect(capsLabel(record({ caps: 4, trips: 4 }))).toBe('4 caps');
    });

    it('calls an uncapped traveller an official rather than claiming a cap', () => {
        expect(capsLabel(record({ caps: 0, trips: 2 }))).toBe('Delegation official');
    });
});

describe('roleLabel', () => {
    it('names each squad role', () => {
        expect(roleLabel('LEADER')).toBe('Head of Delegation');
        expect(roleLabel('COACH')).toBe('Coach');
        expect(roleLabel('COMPETITOR')).toBe('Competitor');
    });

    it('falls back to competitor for an unknown role', () => {
        expect(roleLabel('SOMETHING_NEW')).toBe('Competitor');
    });
});

describe('appearancePlace', () => {
    it('joins city and country', () => {
        expect(appearancePlace(app())).toBe('Tokyo, Japan');
    });

    it('omits a missing city without leaving a comma', () => {
        expect(appearancePlace(app({ hostCity: null }))).toBe('Japan');
    });
});

describe('readInternational', () => {
    it('returns an empty record for junk', () => {
        expect(readInternational(null)).toEqual(EMPTY_INTERNATIONAL);
        expect(readInternational(undefined)).toEqual(EMPTY_INTERNATIONAL);
        expect(readInternational('nope')).toEqual(EMPTY_INTERNATIONAL);
    });

    it('passes a well-formed record through', () => {
        const r = readInternational({ caps: 2, trips: 3, countries: ['JP'], appearances: [app()] });
        expect(r.caps).toBe(2);
        expect(r.trips).toBe(3);
        expect(r.countries).toEqual(['JP']);
        expect(r.appearances).toHaveLength(1);
    });

    it('defends against missing fields from an older API build', () => {
        // The profile must not crash while the backend is mid-deploy.
        const r = readInternational({ caps: 1 });
        expect(r).toEqual({ caps: 1, trips: 0, countries: [], appearances: [] });
    });
});
