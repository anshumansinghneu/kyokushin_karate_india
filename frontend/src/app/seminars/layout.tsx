import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seminars',
  description: 'Explore Kyokushin Karate seminars and special training sessions conducted by senior instructors and visiting masters at KKFI.',
  openGraph: {
    title: 'Seminars | KKFI',
    description: 'Kyokushin Karate seminars and special training sessions by KKFI.',
  },
};

export default function SeminarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
