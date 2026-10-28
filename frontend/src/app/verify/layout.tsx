import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Membership",
  description: "Verify a KKFI membership: enter the membership number, or scan the QR code on a KKFI card or certificate with your phone camera.",
  openGraph: {
    title: "Verify Membership | KKFI",
    description: "Verify a KKFI membership by its number, or from the QR code on a KKFI card or certificate.",
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
