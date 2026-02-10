import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Post',
  description: 'Read this article from the Kyokushin Karate Foundation of India blog.',
  openGraph: {
    title: 'Blog Post | KKFI',
    description: 'An article from the Kyokushin Karate Foundation of India blog.',
  },
};

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
