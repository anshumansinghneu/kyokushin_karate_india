import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Renew Membership',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RenewMembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
