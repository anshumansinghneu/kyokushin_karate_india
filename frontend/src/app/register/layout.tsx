import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Join the Kyokushin Karate Foundation of India. Register as a student or instructor and begin your martial arts journey with KKFI.',
  openGraph: {
    title: 'Register | KKFI',
    description: 'Join the Kyokushin Karate Foundation of India. Register as a student or instructor.',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
