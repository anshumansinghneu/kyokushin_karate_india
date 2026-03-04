import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact KKFI | Kyokushin Karate Enquiries & Dojo Information',
  description: 'Contact the Kyokushin Karate Foundation of India for dojo information, membership enquiries, and training details. HQ: Shuklaganj, Unnao, UP. Call: +91 99567 45114.',
  alternates: {
    canonical: 'https://kyokushinfoundation.com/contact',
  },
  openGraph: {
    title: 'Contact Us | Kyokushin Karate Foundation of India',
    description: 'Contact KKFI — Shuklaganj Bypass Rd, Unnao, UP 209861. Phone: +91 99567 45114.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
