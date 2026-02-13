import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Karate Tournaments & Events 2026 | Full Contact Competitions India',
  description: 'Browse upcoming Kyokushin Karate tournaments, belt grading events, training camps, and seminars across India. Register for KKFI full-contact karate competitions 2026.',
  keywords: ['karate tournament India 2026', 'Kyokushin tournament', 'full contact karate competition', 'karate grading event', 'martial arts events India'],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/events',
  },
  openGraph: {
    title: 'Karate Tournaments & Events 2026 | KKFI',
    description: 'Upcoming Kyokushin full-contact karate tournaments, gradings, and seminars across India.',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
