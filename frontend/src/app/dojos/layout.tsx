import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find a Dojo',
  description: 'Discover Kyokushin Karate dojos across India. Find training locations, class schedules, and instructors near you with KKFI.',
  openGraph: {
    title: 'Find a Dojo | KKFI',
    description: 'Discover Kyokushin Karate dojos across India. Find training locations near you.',
  },
};

export default function DojosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
