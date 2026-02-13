import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corporate Social Responsibility | KKFI Community Impact',
  description: 'Learn about KKFI\'s CSR initiatives — making full-contact Kyokushin karate training accessible to underprivileged youth across India. Community impact, partnerships & social programs.',
  alternates: {
    canonical: 'https://kyokushinfoundation.com/csr',
  },
  openGraph: {
    title: 'CSR | Kyokushin Karate Foundation of India',
    description: 'KKFI CSR initiatives — making martial arts training accessible to underprivileged youth across India.',
  },
};

export default function CSRLayout({ children }: { children: React.ReactNode }) {
  return children;
}
