import { MEDIA_BASE } from './config';

/** Every homepage media URL goes through here, so the files can move to a CDN without code changes. */
export function mediaUrl(path: string): string {
    return `${MEDIA_BASE}/${path.replace(/^\//, '')}`;
}

export type FilmName = 'karateka' | 'kumite' | 'osu' | 'eyes';

/** Written by scripts/prepare-media.sh. Frame counts and format are never hardcoded. */
export interface MediaManifest {
    ext: 'webp' | 'jpg';
    src: [number, number];
    mCropX: number;
    films: Partial<Record<FilmName, { d: number; m: number }>>;
}

let manifest: Promise<MediaManifest> | null = null;

export function loadManifest(): Promise<MediaManifest> {
    manifest ??= fetch(mediaUrl('manifest.json')).then((res) => {
        if (!res.ok) throw new Error(`media manifest: ${res.status}`);
        return res.json() as Promise<MediaManifest>;
    });
    return manifest;
}

/** URL of one frame, 1-based like the files on disk. */
export function frameUrl(m: MediaManifest, film: FilmName, set: 'd' | 'm', index: number): string {
    return mediaUrl(`seq/${film}/${set}/${String(index).padStart(4, '0')}.${m.ext}`);
}
