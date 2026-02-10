import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Kyokushin Karate',
  description: 'Learn about Kyokushin Karate — its history, philosophy, training methods, and the legacy of founder Masutatsu Oyama. Introduction by KKFI.',
  openGraph: {
    title: 'About Kyokushin Karate | KKFI',
    description: 'History, philosophy, and training methods of Kyokushin Karate — the strongest karate.',
  },
};

export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
