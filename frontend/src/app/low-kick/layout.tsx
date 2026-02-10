import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Low Kick Tournament Rules',
  description: 'Official rules and regulations for Kyokushin Karate low kick tournaments organized by KKFI. Weight categories, scoring, and match format.',
  openGraph: {
    title: 'Low Kick Tournament Rules | KKFI',
    description: 'Official low kick tournament rules and regulations by KKFI.',
  },
};

export default function LowKickLayout({ children }: { children: React.ReactNode }) {
  return children;
}
