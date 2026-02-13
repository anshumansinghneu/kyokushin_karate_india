import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find a Kyokushin Dojo Near You | Karate Classes Across India',
  description: 'Find Kyokushin Karate dojos and full-contact karate classes near you. KKFI training locations across India — self-defense classes for kids and adults. Join your nearest dojo today!',
  keywords: ['Kyokushin dojo near me', 'karate classes near me', 'martial arts for kids near me', 'full contact karate dojo India', 'self-defense classes near me'],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/dojos',
  },
  openGraph: {
    title: 'Find a Kyokushin Dojo Near You | KKFI',
    description: 'Find Kyokushin full-contact karate classes near you — dojos across India for kids and adults.',
  },
};

export default function DojosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
