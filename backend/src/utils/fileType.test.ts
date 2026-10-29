import { describe, expect, it } from 'vitest';
import { sniffFileType } from './fileType';

const bytes = (...parts: (number[] | string)[]) =>
    Buffer.concat(parts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'ascii') : Buffer.from(p))));

describe('sniffFileType', () => {
    it('recognises real images and PDFs by their bytes', () => {
        expect(sniffFileType(bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF'))?.ext).toBe('.jpg');
        expect(sniffFileType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'IHDR'))?.ext).toBe('.png');
        expect(sniffFileType(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))?.ext).toBe('.webp');
        expect(sniffFileType(bytes([0, 0, 0, 0x1c], 'ftypheic', [0, 0]))?.ext).toBe('.heic');
        expect(sniffFileType(bytes('%PDF-1.7\n'))?.type).toBe('application/pdf');
    });

    it('refuses SVG, HTML and scripts whatever they claim to be', () => {
        expect(sniffFileType(bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
        expect(sniffFileType(bytes('<!doctype html><script>alert(1)</script>'))).toBeNull();
        expect(sniffFileType(bytes('#!/bin/sh\necho hi'))).toBeNull();
        expect(sniffFileType(Buffer.alloc(0))).toBeNull();
    });
});
