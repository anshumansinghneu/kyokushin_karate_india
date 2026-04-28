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

export interface VideoMetadata {
  provider: 'youtube' | 'vimeo';
  id: string;
  thumbnailUrl: string;
  duration: number | null;
  title: string;
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    throw new Error('Could not parse video URL. Supported: YouTube and Vimeo links.');
  }

  const oembedUrl =
    parsed.provider === 'youtube'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;

  let res: Response;
  try {
    res = await fetch(oembedUrl);
  } catch {
    throw new Error(`Could not reach ${parsed.provider} to fetch video metadata. Check your connection and try again.`);
  }

  if (!res.ok) {
    throw new Error('Video metadata could not be fetched. Verify the video is public and try again.');
  }

  let data: { thumbnail_url?: string; duration?: number; title?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error('Video metadata response was not valid JSON. The provider may be having issues.');
  }

  if (!data.thumbnail_url) {
    throw new Error('Video metadata missing thumbnail. Provider may have rejected the request.');
  }

  return {
    provider: parsed.provider,
    id: parsed.id,
    thumbnailUrl: data.thumbnail_url,
    duration: typeof data.duration === 'number' ? data.duration : null,
    title: data.title ?? '',
  };
}
