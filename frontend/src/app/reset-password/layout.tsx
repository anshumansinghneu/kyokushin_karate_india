import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your KKFI account.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Reset Password | KKFI',
    description: 'Set a new password for your Kyokushin Karate Foundation of India account.',
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
