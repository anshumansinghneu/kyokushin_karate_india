import { describe, it, expect } from 'vitest';
import { buildAutoBio, formatExperience, resolveBio } from './delegationBio';

describe('formatExperience', () => {
    it('formats years and months, singular and plural', () => {
        expect(formatExperience(8, 0)).toBe('8 years');
        expect(formatExperience(1, 0)).toBe('1 year');
        expect(formatExperience(0, 6)).toBe('6 months');
        expect(formatExperience(0, 1)).toBe('1 month');
        expect(formatExperience(2, 3)).toBe('2 years 3 months');
    });

    it('returns empty when nothing is recorded, rather than "0 years"', () => {
        expect(formatExperience(0, 0)).toBe('');
        expect(formatExperience(null, null)).toBe('');
        expect(formatExperience(undefined, undefined)).toBe('');
    });

    it('ignores negative values', () => {
        expect(formatExperience(-5, -2)).toBe('');
    });
});

describe('buildAutoBio', () => {
    it('composes rank, dojo and experience', () => {
        expect(buildAutoBio({
            rankAtSelection: 'Black 3rd Dan',
            dojoName: 'Mas Oyama Karate Academy',
            city: 'Kanpur',
            state: 'Uttar Pradesh',
            experienceYears: 8,
        })).toBe('3rd Dan · Mas Oyama Karate Academy, Kanpur, Uttar Pradesh · 8 years training');
    });

    it('does not repeat the place when the dojo name already contains it', () => {
        expect(buildAutoBio({
            rankAtSelection: 'Brown',
            dojoName: 'Mas Oyama Karate Academy, Kanpur',
            city: 'Kanpur',
            experienceYears: 3,
        })).toBe('Brown · Mas Oyama Karate Academy, Kanpur · 3 years training');
    });

    it('falls back to the city when there is no dojo', () => {
        expect(buildAutoBio({ rankAtSelection: 'Brown', city: 'Guwahati', state: 'Assam' }))
            .toBe('Brown · Guwahati, Assam');
    });

    it('drops missing segments instead of leaving empty separators', () => {
        expect(buildAutoBio({ rankAtSelection: 'Black 1st Dan' })).toBe('1st Dan');
        expect(buildAutoBio({})).toBe('');
    });

    it('never emits a dangling separator', () => {
        for (const source of [
            {},
            { rankAtSelection: 'White' },
            { city: 'Pune' },
            { experienceYears: 4 },
            { rankAtSelection: 'Brown', experienceYears: 4 },
        ]) {
            const bio = buildAutoBio(source);
            expect(bio.startsWith('·'), JSON.stringify(source)).toBe(false);
            expect(bio.endsWith('·'), JSON.stringify(source)).toBe(false);
            expect(bio.includes('··'), JSON.stringify(source)).toBe(false);
        }
    });
});

describe('resolveBio', () => {
    it('prefers a hand-written override', () => {
        const source = { rankAtSelection: 'Brown', city: 'Pune' };
        expect(resolveBio('First time representing India abroad.', source))
            .toBe('First time representing India abroad.');
    });

    it('falls back to the generated line when the override is blank', () => {
        const source = { rankAtSelection: 'Brown', city: 'Pune' };
        expect(resolveBio(null, source)).toBe('Brown · Pune');
        expect(resolveBio('', source)).toBe('Brown · Pune');
        expect(resolveBio('   ', source)).toBe('Brown · Pune');
    });
});
