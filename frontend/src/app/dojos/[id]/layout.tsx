import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dojo Details',
  description: 'View details about this Kyokushin Karate dojo — location, instructors, class schedule, and contact information.',
  openGraph: {
    title: 'Dojo Details | KKFI',
    description: 'Kyokushin Karate dojo details — location, instructors, and schedule.',
  },
};

export default function DojoDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
