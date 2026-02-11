import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Membership",
  description: "Verify the authenticity of a KKFI membership. Scan QR codes or enter membership numbers to validate.",
  openGraph: {
    title: "Verify Membership | KKFI",
    description: "Verify KKFI membership authenticity. Scan QR or enter membership number.",
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
