import { describe, it, expect } from 'vitest';
import {
    COUNTRIES,
    DEFAULT_THEME,
    countryLabel,
    countryTheme,
    countryWordmark,
    findCountry,
    flagUrl,
    isCountryCode,
    searchCountries,
} from './countries';

describe('COUNTRIES', () => {
    it('parses a substantial list', () => {
        expect(COUNTRIES.length).toBeGreaterThan(180);
    });

    it('gives every entry a two-letter code and a name', () => {
        const bad = COUNTRIES.filter((c) => !/^[A-Z]{2}$/.test(c.code) || c.name.length === 0);
        expect(bad).toEqual([]);
    });

    it('has no duplicate codes', () => {
        const codes = COUNTRIES.map((c) => c.code);
        expect(codes.length).toBe(new Set(codes).size);
    });

    it('never leaves a stray colon in a parsed name', () => {
        // The source is a "CODE:Name|CODE:Name" string; a bad split would show up
        // as a colon surviving into the name.
        expect(COUNTRIES.filter((c) => c.name.includes(':'))).toEqual([]);
    });
});

describe('findCountry', () => {
    it('finds a country by code', () => {
        expect(findCountry('JP')).toEqual({ code: 'JP', name: 'Japan' });
    });

    it('accepts lowercase and padded input', () => {
        // Old rows and hand-entered values will not be tidy.
        expect(findCountry(' jp ')?.name).toBe('Japan');
    });

    it('returns null for an unknown or empty code', () => {
        expect(findCountry('ZZ')).toBeNull();
        expect(findCountry('')).toBeNull();
        expect(findCountry(null)).toBeNull();
        expect(findCountry(undefined)).toBeNull();
    });
});

describe('isCountryCode', () => {
    it('accepts a real code and rejects a made-up one', () => {
        expect(isCountryCode('in')).toBe(true);
        expect(isCountryCode('ZZ')).toBe(false);
        expect(isCountryCode(null)).toBe(false);
    });
});

describe('countryTheme', () => {
    it('returns curated colours for a themed country', () => {
        expect(countryTheme('JP').colors).toEqual(['#E0002E', '#FFFFFF']);
    });

    it('falls back to the Kyokushin palette for an unthemed country', () => {
        // Nauru has no curated entry; it must still render deliberately.
        expect(countryTheme('NR')).toBe(DEFAULT_THEME);
        expect(countryTheme('NR').colors).toEqual(['#FF0000', '#FFD700']);
    });

    it('falls back for an unknown code rather than throwing', () => {
        expect(countryTheme('ZZ')).toBe(DEFAULT_THEME);
        expect(countryTheme(null)).toBe(DEFAULT_THEME);
    });

    it('gives every curated colour a valid hex value', () => {
        const bad: string[] = [];
        for (const c of COUNTRIES) {
            for (const hex of countryTheme(c.code).colors) {
                if (!/^#[0-9A-F]{6}$/i.test(hex)) bad.push(`${c.code}:${hex}`);
            }
        }
        expect(bad).toEqual([]);
    });
});

describe('countryLabel', () => {
    it('appends the native name when it differs', () => {
        expect(countryLabel('JP')).toBe('Japan · 日本');
    });

    it('shows the plain name when there is no native variant', () => {
        expect(countryLabel('US')).toBe('United States');
    });

    it('does not repeat the name when the native form is identical', () => {
        // Türkiye is already the endonym, so "Türkiye · Türkiye" would be silly.
        expect(countryLabel('TR')).toBe('Türkiye');
    });

    it('is empty for an unknown code', () => {
        expect(countryLabel('ZZ')).toBe('');
    });
});

describe('countryWordmark', () => {
    it('prefers the native script for the ghosted word', () => {
        expect(countryWordmark('JP')).toBe('日本');
        expect(countryWordmark('RU')).toBe('Россия');
    });

    it('uses the English name when there is no native form', () => {
        expect(countryWordmark('US')).toBe('United States');
    });

    it('is empty for an unknown code, so the hero can skip it', () => {
        expect(countryWordmark('ZZ')).toBe('');
    });
});

describe('flagUrl', () => {
    it('builds a lowercase flag URL at the requested width', () => {
        expect(flagUrl('JP', 160)).toBe('https://flagcdn.com/w160/jp.png');
    });

    it('defaults to a sensible width', () => {
        expect(flagUrl('in')).toBe('https://flagcdn.com/w160/in.png');
    });
});

describe('searchCountries', () => {
    it('returns everything for an empty query', () => {
        expect(searchCountries('   ')).toHaveLength(COUNTRIES.length);
    });

    it('matches case-insensitively on a partial name', () => {
        expect(searchCountries('jap').map((c) => c.code)).toEqual(['JP']);
    });

    it('matches mid-word, so "land" finds Finland and Poland', () => {
        const codes = searchCountries('land').map((c) => c.code);
        expect(codes).toContain('FI');
        expect(codes).toContain('PL');
    });

    it('matches an exact code so an admin can type "JP"', () => {
        expect(searchCountries('JP').map((c) => c.code)).toContain('JP');
    });

    it('returns nothing for gibberish', () => {
        expect(searchCountries('qqqqzz')).toEqual([]);
    });
});
