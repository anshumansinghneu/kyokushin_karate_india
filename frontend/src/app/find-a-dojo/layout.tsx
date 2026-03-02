import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find a Kyokushin Karate Dojo Near You | Classes Across India',
  description:
    'Use our interactive map to find the nearest Kyokushin Karate dojo in India. Full-contact karate classes for kids & adults in Mumbai, Delhi, Bangalore, Lucknow, and more cities. Start training today!',
  keywords: [
    'Kyokushin dojo near me',
    'karate classes near me',
    'martial arts near me',
    'full contact karate dojo India',
    'karate training centers India',
    'self defense classes near me',
    'karate for kids near me',
    'Kyokushin Karate locations',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/find-a-dojo',
  },
  openGraph: {
    title: 'Find a Kyokushin Karate Dojo Near You | KKFI',
    description:
      'Interactive map of all Kyokushin Karate dojos across India. Find classes for kids & adults near you.',
    url: 'https://kyokushinfoundation.com/find-a-dojo',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KKFI Dojo Locations Across India' }],
  },
};

export default function FindADojoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
