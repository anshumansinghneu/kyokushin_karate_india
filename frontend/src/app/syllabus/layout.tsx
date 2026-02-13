import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kyokushin Belt Syllabus & Training Curriculum | White to Black Belt",
  description: "Complete Kyokushin Karate grading syllabus — kihon, kata, kumite requirements for every belt from White to Black. Official KKFI training curriculum 2026.",
  keywords: ["Kyokushin grading syllabus 2026", "karate belt requirements", "Kyokushin kata list", "karate training curriculum", "belt promotion requirements"],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/syllabus',
  },
  openGraph: {
    title: "Kyokushin Belt Syllabus | KKFI Training Curriculum",
    description: "Complete Kyokushin belt curriculum from White to Black belt — kata, kumite & conditioning requirements for every grade.",
  },
};

export default function SyllabusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
