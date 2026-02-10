import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for the Kyokushin Karate Foundation of India. How we collect, use, and protect your personal information.',
  openGraph: {
    title: 'Privacy Policy | KKFI',
    description: 'How KKFI collects, uses, and protects your personal information.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
