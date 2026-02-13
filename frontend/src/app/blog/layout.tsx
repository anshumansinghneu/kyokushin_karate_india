import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Kyokushin Karate Articles, Training Tips & News',
  description: 'Read expert articles on full-contact Kyokushin karate — training techniques, grading syllabus, youth development, tournament guides & martial arts philosophy. By the Kyokushin Karate Foundation of India.',
  keywords: [
    'Kyokushin karate blog',
    'karate training tips',
    'full contact karate articles',
    'martial arts India blog',
    'Kyokushin news',
    'karate for kids articles',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/blog',
  },
  openGraph: {
    title: 'Blog | Kyokushin Karate Foundation of India',
    description: 'Expert articles on Kyokushin karate training, philosophy, youth development, and the martial arts journey in India.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
