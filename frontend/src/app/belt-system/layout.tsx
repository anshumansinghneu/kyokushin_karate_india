import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kyokushin Belt System & Ranking Order | White to Black Belt Guide',
  description:
    'Complete guide to the Kyokushin Karate belt ranking system — from White Belt (10th Kyu) to Black Belt (Shodan). Learn the meaning of each belt color, time requirements, and what it takes to progress.',
  keywords: [
    'Kyokushin belt system',
    'karate belt order',
    'Kyokushin belt colors',
    'karate ranking system',
    'how long to get black belt karate',
    'Kyokushin kyu system',
    'karate belt progression',
    'karate grading system India',
    'Kyokushin dan ranking',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/belt-system',
  },
  openGraph: {
    title: 'Kyokushin Belt System | White to Black Belt Progression',
    description: 'Visual guide to every Kyokushin Karate belt level — colors, ranks, time requirements, and meaning.',
    url: 'https://kyokushinfoundation.com/belt-system',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Kyokushin Belt System — KKFI' }],
  },
};

export default function BeltSystemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
