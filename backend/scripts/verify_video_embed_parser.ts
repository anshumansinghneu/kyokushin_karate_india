import { parseVideoUrl } from '../src/utils/videoEmbed';

type Case = { url: string; expected: { provider: string; id: string } | null; label: string };

const cases: Case[] = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube watch' },
  { url: 'https://youtu.be/dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtu.be short' },
  { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube embed' },
  { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube shorts' },
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube with timestamp' },
  { url: 'https://vimeo.com/123456789', expected: { provider: 'vimeo', id: '123456789' }, label: 'vimeo basic' },
  { url: 'https://player.vimeo.com/video/123456789', expected: { provider: 'vimeo', id: '123456789' }, label: 'vimeo player' },
  { url: 'https://example.com/video.mp4', expected: null, label: 'random url rejected' },
  { url: 'not a url', expected: null, label: 'garbage rejected' },
  { url: '', expected: null, label: 'empty rejected' },
];

let failed = 0;
for (const c of cases) {
  const got = parseVideoUrl(c.url);
  const ok = JSON.stringify(got) === JSON.stringify(c.expected);
  console.log(`${ok ? '✅' : '❌'} ${c.label}: got=${JSON.stringify(got)} expected=${JSON.stringify(c.expected)}`);
  if (!ok) failed++;
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed === 0 ? 0 : 1);
