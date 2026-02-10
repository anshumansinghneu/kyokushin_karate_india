import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Sponsors',
  description: 'Meet the sponsors supporting the Kyokushin Karate Foundation of India. Learn about our partners and how to become a sponsor.',
  openGraph: {
    title: 'Our Sponsors | KKFI',
    description: 'Sponsors and partners of the Kyokushin Karate Foundation of India.',
  },
};

export default function SponsorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
