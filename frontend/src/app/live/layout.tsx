import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Scoring",
  description: "Watch live tournament match scores in real-time. Follow Kyokushin Karate fights as they happen.",
  openGraph: {
    title: "Live Scoring | KKFI",
    description: "Watch live tournament match scores in real-time.",
  },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
