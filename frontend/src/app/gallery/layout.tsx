import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: 'Browse photos from Kyokushin Karate training sessions, tournaments, belt ceremonies, and events organized by KKFI across India.',
  openGraph: {
    title: 'Photo Gallery | KKFI',
    description: 'Photos from Kyokushin Karate training, tournaments, and events in India.',
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
