export interface ParsedVideo {
  provider: 'youtube' | 'vimeo';
  id: string;
}

const YOUTUBE_REGEXES: RegExp[] = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

const VIMEO_REGEXES: RegExp[] = [
  /(?:vimeo\.com\/)(\d+)/,
  /(?:player\.vimeo\.com\/video\/)(\d+)/,
];

export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url || typeof url !== 'string') return null;

  for (const re of YOUTUBE_REGEXES) {
    const m = url.match(re);
    if (m) return { provider: 'youtube', id: m[1] };
  }

  for (const re of VIMEO_REGEXES) {
    const m = url.match(re);
    if (m) return { provider: 'vimeo', id: m[1] };
  }

  return null;
}
