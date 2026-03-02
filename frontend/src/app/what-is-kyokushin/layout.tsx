import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'What is Kyokushin Karate? | Full-Contact Karate Explained',
  description:
    'Learn about Kyokushin Karate — the world\'s strongest full-contact karate style founded by Mas Oyama. History, philosophy, training methods, benefits for kids & adults, and how to get started in India.',
  keywords: [
    'what is Kyokushin Karate',
    'Kyokushin Karate explained',
    'full contact karate',
    'Mas Oyama karate',
    'Kyokushin vs Shotokan',
    'Kyokushin philosophy',
    'strongest karate style',
    'karate for beginners India',
    'martial arts benefits',
    'full contact karate training',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/what-is-kyokushin',
  },
  openGraph: {
    title: 'What is Kyokushin Karate? | The Strongest Karate Style Explained',
    description:
      'Everything you need to know about Kyokushin Karate — history, training, philosophy, and how to start in India.',
    url: 'https://kyokushinfoundation.com/what-is-kyokushin',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'What is Kyokushin Karate — KKFI' }],
  },
};

export default function WhatIsKyokushinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
