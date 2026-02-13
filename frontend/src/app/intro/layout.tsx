import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About KKFI | India\'s Premier Full Contact Karate Organization',
  description: 'About the Kyokushin Karate Foundation of India — led by Shihan Vasant Kumar Singh. Learn about our mission, Kyokushin philosophy, Sosai Oyama\'s legacy, and full-contact karate training across India.',
  keywords: ['about KKFI', 'Kyokushin karate India', 'Shihan Vasant Kumar Singh', 'full contact karate organization India', 'IKO Kyokushin India'],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/intro',
  },
  openGraph: {
    title: 'About KKFI | Kyokushin Karate Foundation of India',
    description: 'India\'s premier Kyokushin Karate organization — full-contact training, belt gradings, and tournaments led by Shihan Vasant Kumar Singh.',
  },
};

export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
