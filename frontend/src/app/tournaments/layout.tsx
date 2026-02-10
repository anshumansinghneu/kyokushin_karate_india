import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tournament',
  description: 'View Kyokushin Karate tournament details — brackets, matches, and results organized by KKFI.',
  robots: { index: false, follow: false },
};

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
