import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join KKFI | Register for Full Contact Karate Training in India',
  description: 'Register with the Kyokushin Karate Foundation of India. Join as a student or instructor — full-contact karate training, belt gradings & tournaments. Membership starts at ₹295. Start your martial arts journey today!',
  keywords: ['register karate India', 'join Kyokushin dojo', 'karate membership India', 'martial arts registration', 'KKFI membership'],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/register',
  },
  openGraph: {
    title: 'Register | Kyokushin Karate Foundation of India',
    description: 'Join KKFI — register as a student or instructor. Full-contact karate training, belt gradings & tournaments across India.',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
