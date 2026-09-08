import { describe, it, expect } from 'vitest';
import { parseRank, rankTitle, bySeniority, COLOUR_BELTS } from './rank';

describe('parseRank — dan grades', () => {
    it('parses the stored "Black Nth Dan" form', () => {
        expect(parseRank('Black 3rd Dan')).toMatchObject({ kind: 'DAN', dan: 3, label: '3rd Dan' });
        expect(parseRank('Black 10th Dan')).toMatchObject({ kind: 'DAN', dan: 10, label: '10th Dan' });
        expect(parseRank('Black 1st Dan')).toMatchObject({ kind: 'DAN', dan: 1, label: '1st Dan' });
    });

    it('accepts the bare form and loose spacing/casing', () => {
        expect(parseRank('3rd Dan').dan).toBe(3);
        expect(parseRank('3 dan').dan).toBe(3);
        expect(parseRank('  BLACK  7TH  DAN  ').dan).toBe(7);
    });

    it('ranks 10th Dan above 2nd Dan (a lexical sort gets this wrong)', () => {
        expect(parseRank('Black 10th Dan').sortKey).toBeGreaterThan(parseRank('Black 2nd Dan').sortKey);
    });

    it('rejects an out-of-range dan rather than inventing a rank', () => {
        expect(parseRank('Black 11th Dan').kind).not.toBe('DAN');
        expect(parseRank('Black 0 Dan').kind).not.toBe('DAN');
    });
});

describe('parseRank — colour belts', () => {
    it('parses every belt in the project vocabulary', () => {
        for (const colour of COLOUR_BELTS) {
            expect(parseRank(colour), colour).toMatchObject({ kind: 'COLOUR', label: colour });
        }
    });

    it('orders colours by the Kyokushin progression, not alphabetically', () => {
        const order = [...COLOUR_BELTS].sort((a, b) => parseRank(b).sortKey - parseRank(a).sortKey);
        expect(order).toEqual(['Brown', 'Green', 'Yellow', 'Blue', 'Orange', 'White']);
    });

    it('puts every dan above every colour belt', () => {
        expect(parseRank('Black 1st Dan').sortKey).toBeGreaterThan(parseRank('Brown').sortKey);
    });

    it('tolerates a trailing "Belt"', () => {
        expect(parseRank('Brown Belt')).toMatchObject({ kind: 'COLOUR', label: 'Brown' });
    });
});

describe('parseRank — bad input', () => {
    it('does not throw on empty or unknown values', () => {
        expect(parseRank(null)).toMatchObject({ kind: 'UNKNOWN', sortKey: 0 });
        expect(parseRank(undefined)).toMatchObject({ kind: 'UNKNOWN', sortKey: 0 });
        expect(parseRank('')).toMatchObject({ kind: 'UNKNOWN', sortKey: 0 });
        expect(parseRank('Purple')).toMatchObject({ kind: 'UNKNOWN', sortKey: 0 });
    });

    it('sorts unknown ranks last rather than first', () => {
        expect(parseRank('Purple').sortKey).toBeLessThan(parseRank('White').sortKey);
    });
});

describe('rankTitle', () => {
    it('matches the titles used on the black-belts page', () => {
        expect(rankTitle('Black 10th Dan')).toBe('SHIHAN');
        expect(rankTitle('Black 5th Dan')).toBe('SHIHAN');
        expect(rankTitle('Black 4th Dan')).toBe('SENSEI');
        expect(rankTitle('Black 3rd Dan')).toBe('SENSEI');
        expect(rankTitle('Black 2nd Dan')).toBe('SENPAI');
        expect(rankTitle('Black 1st Dan')).toBe('SENPAI');
    });

    it('gives colour belts no title', () => {
        expect(rankTitle('Brown')).toBeNull();
        expect(rankTitle('White')).toBeNull();
    });
});

describe('bySeniority', () => {
    it('orders a mixed squad most senior first', () => {
        const squad = [
            { name: 'Kohai', rankAtSelection: 'White' },
            { name: 'Shihan', rankAtSelection: 'Black 8th Dan' },
            { name: 'Brown belt', rankAtSelection: 'Brown' },
            { name: 'Senpai', rankAtSelection: 'Black 1st Dan' },
            { name: 'Sensei', rankAtSelection: 'Black 3rd Dan' },
        ];
        expect([...squad].sort(bySeniority).map((m) => m.name)).toEqual([
            'Shihan', 'Sensei', 'Senpai', 'Brown belt', 'Kohai',
        ]);
    });

    it('breaks ties by name so ordering is stable', () => {
        const squad = [
            { name: 'Zara', rankAtSelection: 'Brown' },
            { name: 'Amit', rankAtSelection: 'Brown' },
        ];
        expect([...squad].sort(bySeniority).map((m) => m.name)).toEqual(['Amit', 'Zara']);
    });
});
