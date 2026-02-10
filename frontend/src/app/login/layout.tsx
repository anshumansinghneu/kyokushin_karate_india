import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Kyokushin Karate Foundation of India account. Access your dashboard, training logs, belt progress, and more.',
  openGraph: {
    title: 'Sign In | KKFI',
    description: 'Sign in to your Kyokushin Karate Foundation of India account.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
