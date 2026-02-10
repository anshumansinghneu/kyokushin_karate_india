import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Management',
  description: 'KKFI management portal for administrators and instructors. Manage users, dojos, events, and organizational operations.',
  robots: { index: false, follow: false },
};

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
