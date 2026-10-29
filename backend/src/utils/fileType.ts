/**
 * Accepted types, recognised from the file's first bytes rather than the browser's claim
 * or the original name, with the extension chosen here. SVG is not accepted: it can carry
 * script and would be served from the public bucket.
 */
const SIGNATURES: { type: string; ext: string; test: (b: Buffer) => boolean }[] = [
    { type: 'image/jpeg', ext: '.jpg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    { type: 'image/png', ext: '.png', test: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    { type: 'image/gif', ext: '.gif', test: (b) => b.length > 6 && b.subarray(0, 3).toString('ascii') === 'GIF' },
    { type: 'image/webp', ext: '.webp', test: (b) => b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
    { type: 'image/avif', ext: '.avif', test: (b) => b.length > 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' && /^avi[fs]/.test(b.subarray(8, 12).toString('ascii')) },
    { type: 'image/heic', ext: '.heic', test: (b) => b.length > 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' && /^(heic|heix|hevc|mif1)/.test(b.subarray(8, 12).toString('ascii')) },
    { type: 'application/pdf', ext: '.pdf', test: (b) => b.length > 5 && b.subarray(0, 5).toString('ascii') === '%PDF-' },
];
export const sniffFileType = (buffer: Buffer) => SIGNATURES.find((s) => s.test(buffer)) ?? null;
