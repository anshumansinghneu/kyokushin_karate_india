import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Gallery',
  description: 'Browse photos and videos from Kyokushin Karate events, training sessions, belt ceremonies, and tournaments across India.',
  openGraph: {
    title: 'Media Gallery | KKFI',
    description: 'Photos and videos from Kyokushin Karate events, training, and tournaments in India.',
  },
};

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
