import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'What is Kyokushin Karate? | Full-Contact Karate Explained',
  description:
    'Kyokushin, the full-contact karate founded by Sosai Mas Oyama: its history, principles, training methods and the Dojo Kun, and how to start in India.',
  keywords: [
    'what is Kyokushin Karate',
    'Kyokushin Karate explained',
    'full contact karate',
    'Mas Oyama karate',
    'Kyokushin vs Shotokan',
    'Kyokushin philosophy',
    'karate for beginners India',
    'martial arts benefits',
    'full contact karate training',
  ],
  alternates: {
    canonical: 'https://www.kyokushinfoundation.com/what-is-kyokushin',
  },
  openGraph: {
    title: 'What is Kyokushin Karate? | Full-Contact Karate Explained',
    description:
      'Everything you need to know about Kyokushin Karate — history, training, philosophy, and how to start in India.',
    url: 'https://www.kyokushinfoundation.com/what-is-kyokushin',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'What is Kyokushin Karate — KKFI' }],
  },
};

export default function WhatIsKyokushinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
