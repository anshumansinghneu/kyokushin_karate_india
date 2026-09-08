import { describe, it, expect } from 'vitest';
import { normaliseCountryCode, isCountryCode, COUNTRY_CODE_COUNT } from './countryCodes';

describe('normaliseCountryCode', () => {
    it('uppercases and trims a valid code', () => {
        expect(normaliseCountryCode(' jp ')).toBe('JP');
        expect(normaliseCountryCode('in')).toBe('IN');
    });

    it('passes an already-clean code through', () => {
        expect(normaliseCountryCode('RU')).toBe('RU');
    });

    it('rejects a code that is not a real country', () => {
        expect(normaliseCountryCode('ZZ')).toBeNull();
        expect(normaliseCountryCode('XX')).toBeNull();
    });

    it('rejects a country name sent where a code belongs', () => {
        // The exact mistake the picker exists to prevent.
        expect(normaliseCountryCode('Japan')).toBeNull();
    });

    it('treats empty and missing input as no country', () => {
        expect(normaliseCountryCode('')).toBeNull();
        expect(normaliseCountryCode('   ')).toBeNull();
        expect(normaliseCountryCode(null)).toBeNull();
        expect(normaliseCountryCode(undefined)).toBeNull();
    });

    it('rejects non-string input without throwing', () => {
        expect(normaliseCountryCode(42)).toBeNull();
        expect(normaliseCountryCode({})).toBeNull();
        expect(normaliseCountryCode(['JP'])).toBeNull();
    });
});

describe('isCountryCode', () => {
    it('agrees with normaliseCountryCode', () => {
        expect(isCountryCode('jp')).toBe(true);
        expect(isCountryCode('ZZ')).toBe(false);
    });
});

describe('the code list', () => {
    it('covers the countries the delegations feature cares about', () => {
        for (const code of ['IN', 'JP', 'RU', 'KZ', 'UA', 'TH', 'NP', 'LK', 'AE', 'GB', 'US']) {
            expect(isCountryCode(code)).toBe(true);
        }
    });

    it('is a plausible size for ISO 3166-1', () => {
        expect(COUNTRY_CODE_COUNT).toBeGreaterThan(180);
        expect(COUNTRY_CODE_COUNT).toBeLessThan(260);
    });
});
