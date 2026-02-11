import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your KKFI account password. Enter your email and we\'ll send you a secure reset link.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Forgot Password | KKFI',
    description: 'Reset your Kyokushin Karate Foundation of India account password.',
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
