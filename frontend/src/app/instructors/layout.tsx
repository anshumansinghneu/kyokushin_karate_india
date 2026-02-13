import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certified Kyokushin Instructors | Meet Our Senseis",
  description: "Meet the certified Kyokushin Karate instructors of KKFI — experienced black belt holders and qualified senseis offering full-contact karate training for kids and adults across India.",
  keywords: ["Kyokushin karate instructor", "karate sensei India", "certified karate teacher", "martial arts instructor near me"],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/instructors',
  },
  openGraph: {
    title: "Certified Kyokushin Instructors | KKFI",
    description: "Meet our certified black belt instructors — training kids and adults in full-contact Kyokushin karate.",
  },
};

export default function InstructorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
