import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Instructors",
  description: "Meet the certified Kyokushin Karate instructors of KKFI. Experienced black belt holders dedicated to teaching traditional martial arts.",
  openGraph: {
    title: "Our Instructors | KKFI",
    description: "Meet the certified Kyokushin Karate instructors of KKFI.",
  },
};

export default function InstructorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
