import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event Calendar | KKFI Tournaments, Gradings & Seminars',
  description: 'View the complete KKFI event calendar — upcoming karate tournaments, belt grading dates, seminars, and training camps across India.',
  alternates: {
    canonical: 'https://kyokushinfoundation.com/calendar',
  },
  openGraph: {
    title: 'Event Calendar | Kyokushin Karate Foundation of India',
    description: 'Upcoming karate tournaments, belt gradings, seminars, and training camps across India.',
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
