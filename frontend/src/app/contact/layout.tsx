import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Kyokushin Karate Foundation of India. Visit our headquarters in Shuklaganj, Unnao, UP or call us at +91 99567 11400.',
  openGraph: {
    title: 'Contact Us | KKFI',
    description: 'Contact KKFI — Shuklaganj Bypass Rd, Unnao, UP 209861. Phone: +91 99567 11400.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
