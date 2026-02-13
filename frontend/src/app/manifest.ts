import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kyokushin Karate Foundation of India',
    short_name: 'KKFI',
    description: 'Official platform for Kyokushin Karate Foundation of India. Full-contact karate training, dojos, tournaments & belt gradings.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#dc2626',
    icons: [
      {
        src: '/kkfi-logo.avif',
        sizes: '192x192',
        type: 'image/avif',
      },
      {
        src: '/kkfi-logo.avif',
        sizes: '512x512',
        type: 'image/avif',
      },
    ],
  }
}
