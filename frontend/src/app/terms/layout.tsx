import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for the Kyokushin Karate Foundation of India website and membership platform.',
  openGraph: {
    title: 'Terms of Service | KKFI',
    description: 'Terms of Service for the KKFI website and membership platform.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
