import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Syllabus",
  description: "Complete Kyokushin Karate belt curriculum from White to Black belt. Learn about kihon, kata, kumite requirements for each grade.",
  openGraph: {
    title: "Training Syllabus | KKFI",
    description: "Complete Kyokushin Karate belt curriculum from White to Black belt.",
  },
};

export default function SyllabusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
