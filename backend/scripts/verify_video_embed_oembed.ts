import { fetchVideoMetadata } from '../src/utils/videoEmbed';

async function main() {
  const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://vimeo.com/1084537',
  ];

  let failed = 0;
  for (const url of urls) {
    try {
      const meta = await fetchVideoMetadata(url);
      console.log(`✅ ${url}`);
      console.log(`   provider=${meta.provider} id=${meta.id}`);
      console.log(`   title="${meta.title}"`);
      console.log(`   thumbnail=${meta.thumbnailUrl}`);
      console.log(`   duration=${meta.duration ?? 'n/a'}`);
    } catch (e: any) {
      console.error(`❌ ${url}: ${e.message}`);
      failed++;
    }
  }

  // Bad URL must throw
  try {
    await fetchVideoMetadata('https://example.com/foo');
    console.error('❌ expected throw on bad URL but got success');
    failed++;
  } catch (e: any) {
    console.log(`✅ bad URL rejected: ${e.message}`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

main();
