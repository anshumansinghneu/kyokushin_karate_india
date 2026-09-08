import { describe, it, expect } from 'vitest';
import { buildInternationalRecord, type AppearanceRow } from './appearances';

function row(over: Partial<AppearanceRow> & { name?: string } = {}): AppearanceRow {
    const { name, ...rest } = over;
    return {
        delegationId: rest.delegationId ?? 'd1',
        rankAtSelection: rest.rankAtSelection ?? '1st Dan',
        squadRole: rest.squadRole ?? 'COMPETITOR',
        delegation: rest.delegation ?? {
            tournamentName: name ?? 'Test Cup',
            hostCountry: 'Japan',
            hostCountryCode: 'JP',
            startDate: '2026-11-01T00:00:00.000Z',
            hostCity: 'Tokyo',
            isPublished: true,
        },
        ...rest,
    } as AppearanceRow;
}

const del = (over: Record<string, unknown> = {}) => ({
    tournamentName: 'Test Cup',
    hostCountry: 'Japan',
    hostCountryCode: 'JP',
    startDate: '2026-11-01T00:00:00.000Z',
    hostCity: 'Tokyo',
    isPublished: true,
    ...over,
});

describe('buildInternationalRecord', () => {
    it('reports no record for someone who has never travelled', () => {
        expect(buildInternationalRecord([])).toEqual({
            caps: 0,
            trips: 0,
            countries: [],
            appearances: [],
        });
    });

    it('counts a competitor appearance as a cap', () => {
        const r = buildInternationalRecord([row({ squadRole: 'COMPETITOR' })]);
        expect(r.caps).toBe(1);
        expect(r.trips).toBe(1);
    });

    it('counts a coach as a trip but not as a cap', () => {
        // Coaches and officials travelled, but they did not compete, so
        // claiming a "cap" for them would overstate the record.
        const r = buildInternationalRecord([row({ squadRole: 'COACH' })]);
        expect(r.caps).toBe(0);
        expect(r.trips).toBe(1);
    });

    it('counts the head of delegation as a trip but not as a cap', () => {
        const r = buildInternationalRecord([row({ squadRole: 'LEADER' })]);
        expect(r.caps).toBe(0);
        expect(r.trips).toBe(1);
    });

    it('excludes a draft delegation entirely', () => {
        // A squad that has not been published must never leak onto a public
        // profile, not even as a count.
        const r = buildInternationalRecord([
            row({ delegationId: 'a', delegation: del() }),
            row({ delegationId: 'b', delegation: del({ isPublished: false, tournamentName: 'Secret' }) }),
        ]);
        expect(r.trips).toBe(1);
        expect(r.appearances.map((a) => a.tournamentName)).toEqual(['Test Cup']);
    });

    it('drops a row whose delegation is missing', () => {
        expect(buildInternationalRecord([row({ delegation: null })]).trips).toBe(0);
    });

    it('lists the most recent trip first', () => {
        const r = buildInternationalRecord([
            row({ delegationId: 'old', delegation: del({ tournamentName: 'Older', startDate: '2024-01-01T00:00:00.000Z' }) }),
            row({ delegationId: 'new', delegation: del({ tournamentName: 'Newer', startDate: '2026-01-01T00:00:00.000Z' }) }),
        ]);
        expect(r.appearances.map((a) => a.tournamentName)).toEqual(['Newer', 'Older']);
    });

    it('collects each country once even across several trips there', () => {
        // The passport shows places, not trips: two visits to Japan is one flag
        // but still two caps.
        const r = buildInternationalRecord([
            row({ delegationId: 'a', delegation: del({ startDate: '2024-01-01T00:00:00.000Z' }) }),
            row({ delegationId: 'b', delegation: del({ startDate: '2026-01-01T00:00:00.000Z' }) }),
        ]);
        expect(r.countries).toEqual(['JP']);
        expect(r.caps).toBe(2);
    });

    it('orders countries by most recent visit', () => {
        const r = buildInternationalRecord([
            row({ delegationId: 'a', delegation: del({ hostCountryCode: 'RU', startDate: '2024-01-01T00:00:00.000Z' }) }),
            row({ delegationId: 'b', delegation: del({ hostCountryCode: 'JP', startDate: '2026-01-01T00:00:00.000Z' }) }),
        ]);
        expect(r.countries).toEqual(['JP', 'RU']);
    });

    it('normalises a lowercase country code', () => {
        const r = buildInternationalRecord([row({ delegation: del({ hostCountryCode: 'jp' }) })]);
        expect(r.countries).toEqual(['JP']);
        expect(r.appearances[0].hostCountryCode).toBe('JP');
    });

    it('skips the passport for a trip with no country code', () => {
        // Rows created before the country picker existed still count as trips.
        const r = buildInternationalRecord([row({ delegation: del({ hostCountryCode: null }) })]);
        expect(r.trips).toBe(1);
        expect(r.countries).toEqual([]);
        expect(r.appearances[0].hostCountryCode).toBeNull();
    });

    it('keeps the rank the member actually held on that trip', () => {
        // Frozen at selection on purpose: promotion later must not rewrite
        // history on the profile.
        const r = buildInternationalRecord([row({ rankAtSelection: '3rd Dan' })]);
        expect(r.appearances[0].rankAtSelection).toBe('3rd Dan');
    });

    it('exposes the year and host so the profile need not parse dates', () => {
        const r = buildInternationalRecord([row({ delegation: del({ startDate: '2026-11-01T00:00:00.000Z' }) })]);
        expect(r.appearances[0].year).toBe(2026);
        expect(r.appearances[0].hostCity).toBe('Tokyo');
        expect(r.appearances[0].hostCountry).toBe('Japan');
    });

    it('reads the year in UTC, not the server timezone', () => {
        // 1 Jan UTC midnight is still the previous year in any western zone.
        const r = buildInternationalRecord([row({ delegation: del({ startDate: '2026-01-01T00:00:00.000Z' }) })]);
        expect(r.appearances[0].year).toBe(2026);
    });

    it('accepts a Date as well as an ISO string', () => {
        const r = buildInternationalRecord([
            row({ delegation: del({ startDate: new Date('2025-06-01T00:00:00.000Z') }) }),
        ]);
        expect(r.appearances[0].year).toBe(2025);
    });

    it('mixes roles across trips without double counting', () => {
        const r = buildInternationalRecord([
            row({ delegationId: 'a', squadRole: 'COMPETITOR', delegation: del({ hostCountryCode: 'JP', startDate: '2026-01-01T00:00:00.000Z' }) }),
            row({ delegationId: 'b', squadRole: 'COACH', delegation: del({ hostCountryCode: 'RU', startDate: '2025-01-01T00:00:00.000Z' }) }),
        ]);
        expect(r).toMatchObject({ caps: 1, trips: 2, countries: ['JP', 'RU'] });
    });
});
