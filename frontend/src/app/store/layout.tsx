import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Store",
  description: "Shop official Kyokushin Karate Foundation of India merchandise. Gi, belts, training equipment, and accessories.",
  openGraph: {
    title: "KKFI Store | Official Merchandise",
    description: "Shop official Kyokushin Karate Foundation of India merchandise.",
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
