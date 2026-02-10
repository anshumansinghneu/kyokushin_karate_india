import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events & Tournaments',
  description: 'Browse upcoming Kyokushin Karate events, tournaments, training camps, and seminars organized by KKFI across India.',
  openGraph: {
    title: 'Events & Tournaments | KKFI',
    description: 'Upcoming Kyokushin Karate events, tournaments, and training camps in India.',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
