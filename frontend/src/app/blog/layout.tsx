import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest news, articles, and updates from the Kyokushin Karate Foundation of India. Training tips, event recaps, and community stories.',
  openGraph: {
    title: 'Blog | KKFI',
    description: 'Latest news, articles, and updates from KKFI — training tips, event recaps, and stories.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
