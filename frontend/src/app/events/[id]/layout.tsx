import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event Details',
  description: 'View event details — date, location, registration info, and schedule for this Kyokushin Karate event by KKFI.',
  openGraph: {
    title: 'Event Details | KKFI',
    description: 'Kyokushin Karate event details — date, location, and registration.',
  },
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
