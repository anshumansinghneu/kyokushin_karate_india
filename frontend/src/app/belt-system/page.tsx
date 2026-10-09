'use client';

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Script from 'next/script';
import { useMemo, useRef, useState } from 'react';
import SceneSlot from '@/components/three/SceneSlot';
import Reveal from '@/components/brand/Reveal';
import Section, { Heading } from '@/components/brand/Section';
import BrandLink from '@/components/brand/BrandLink';

interface BeltLevel {
  belt: string;
  rank: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  timeRequired: string;
  meaning: string;
  kataCount: number;
  keyFocus: string;
}

const BELTS: BeltLevel[] = [
  {
    belt: 'White',
    rank: 'Mukyu (ungraded)',
    color: '#ffffff',
    bgClass: 'bg-white',
    borderClass: 'border-white/30',
    textClass: 'text-gray-200',
    timeRequired: 'Beginner',
    meaning: 'Purity and innocence — the blank slate of a new student, ready to absorb knowledge.',
    kataCount: 2,
    keyFocus: 'Basic stances, punches, kicks, dojo etiquette',
  },
  {
    belt: 'Orange',
    rank: '10th–9th Kyu',
    color: '#f97316',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
    timeRequired: '3–6 months',
    meaning: 'The rising sun — the student begins to see the light of knowledge and training.',
    kataCount: 2,
    keyFocus: 'Combination techniques, first sparring experience',
  },
  {
    belt: 'Blue',
    rank: '8th–7th Kyu',
    color: '#3b82f6',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
    timeRequired: '6–12 months',
    meaning: 'The sky — as the student looks up to higher goals and deeper understanding.',
    kataCount: 2,
    keyFocus: 'Advanced kicks, improved speed and power',
  },
  {
    belt: 'Yellow',
    rank: '6th–5th Kyu',
    color: '#eab308',
    bgClass: 'bg-yellow-500',
    borderClass: 'border-yellow-500/30',
    textClass: 'text-yellow-400',
    timeRequired: '1–1.5 years',
    meaning: 'The sun at its peak — growing strength and developing solid technique.',
    kataCount: 2,
    keyFocus: 'Complex combinations, controlled sparring',
  },
  {
    belt: 'Green',
    rank: '4th–3rd Kyu',
    color: '#22c55e',
    bgClass: 'bg-green-500',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-400',
    timeRequired: '1.5–2.5 years',
    meaning: 'Growth — like a plant maturing, the student develops deeper roots in the art.',
    kataCount: 3,
    keyFocus: 'Intermediate kata, real fighting strategy',
  },
  {
    belt: 'Brown',
    rank: '2nd–1st Kyu',
    color: '#92400e',
    bgClass: 'bg-amber-700',
    borderClass: 'border-amber-700/30',
    textClass: 'text-amber-500',
    timeRequired: '2.5–4 years',
    meaning: 'Maturity — the seed has fully grown. The student refines technique and prepares for black belt.',
    kataCount: 4,
    keyFocus: 'Advanced kata, Sanchin breathing, mental fortitude',
  },
  {
    belt: 'Black (Shodan)',
    rank: '1st Dan',
    color: '#000000',
    bgClass: 'bg-black',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-500',
    timeRequired: '4–6+ years',
    meaning: 'The beginning of true mastery. In Kyokushin, black belt means "serious student" — the real learning begins here.',
    kataCount: 5,
    keyFocus: '20-man kumite, complete technical mastery, teaching ability',
  },
];

const DAN_RANKS = [
  { dan: '1st Dan', title: 'Shodan', years: '4–6', note: 'Complete the 20-man kumite. You are now a serious student.' },
  { dan: '2nd Dan', title: 'Nidan', years: '6–8', note: 'Minimum 2 years after Shodan. Deeper technical refinement.' },
  { dan: '3rd Dan', title: 'Sandan', years: '9–12', note: 'Teaching proficiency expected. Title: Senpai (senior student).' },
  { dan: '4th Dan', title: 'Yondan', years: '12–16', note: 'Title: Sensei (teacher). Authorized to open own dojo.' },
  { dan: '5th Dan', title: 'Godan', years: '17+', note: 'Title: Shihan (master). Exceptional contribution to Kyokushin.' },
  { dan: '6th–10th Dan', title: 'Rokudan+', years: '20+', note: 'Lifetime achievement. 10th Dan reserved for the founder.' },
];

type Step =
  | { kind: 'intro' }
  | { kind: 'kyu'; belt: BeltLevel; index: number }
  | { kind: 'dan'; rank: (typeof DAN_RANKS)[number]; degree: number };

const STEPS: Step[] = [
  { kind: 'intro' },
  ...BELTS.map((belt, index) => ({ kind: 'kyu' as const, belt, index })),
  ...DAN_RANKS.slice(1).map((rank, i) => ({ kind: 'dan' as const, rank, degree: i + 2 })),
];

/** What the 3D belt shows at each step. Black cloth is lifted off pure black so the weave reads. */
const STOPS = STEPS.map((step) => {
  if (step.kind === 'intro') return { color: BELTS[0].color, bars: 0 };
  if (step.kind === 'kyu') return { color: step.belt.color === '#000000' ? '#161616' : step.belt.color, bars: step.index === BELTS.length - 1 ? 1 : 0 };
  return { color: '#161616', bars: Math.min(6, step.degree) };
});

const swatch = (color: string) => (color === '#000000' ? '#161616' : color);

const FAQS = [
  {
    q: 'How long does it take to get a black belt in Kyokushin?',
    a: 'Typically 4–6 years of consistent training (3–4 sessions per week). Kyokushin is one of the hardest martial arts to earn a black belt in, requiring a 20-man kumite (fighting 20 opponents consecutively).',
  },
  {
    q: 'Can you skip belt levels?',
    a: 'No. In Kyokushin, every student progresses through each belt in order. There are no shortcuts — each level builds essential skills for the next.',
  },
  {
    q: 'How often are belt gradings held?',
    a: 'KKFI conducts gradings approximately every 3–6 months, depending on the dojo. Your instructor will recommend you for grading when ready.',
  },
  {
    q: 'What is the 20-man kumite?',
    a: 'The 20-man kumite (二十人組手) is the ultimate test for Shodan — you must fight 20 fresh opponents, one after another, in full-contact bouts. It tests endurance, spirit, and technical ability under extreme fatigue.',
  },
  {
    q: 'Is Kyokushin safe for children?',
    a: "Yes! Children's classes adapt training intensity to their age. Full-contact sparring is introduced gradually from ages 8–10 with protective gear and supervision.",
  },
];

function StepCopy({ step }: { step: Step }) {
  if (step.kind === 'intro') {
    return (
      <>
        <h1 className="text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
          The belt<br />system<span className="text-primary">.</span>
        </h1>
        <p className="mt-6 max-w-[40ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
          From white belt to the dan grades. Scroll to dye the belt through every rank, and see what
          each one asks of you.
        </p>
      </>
    );
  }
  if (step.kind === 'kyu') {
    const { belt } = step;
    return (
      <>
        <p className="flex items-center gap-3 text-sm font-semibold text-white/75">
          <span className="h-3 w-8 rounded-sm ring-1 ring-white/30" style={{ backgroundColor: swatch(belt.color) }} aria-hidden="true" />
          {belt.rank}
        </p>
        <h2 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
          {belt.belt === 'Black (Shodan)' ? <>Black belt<span className="text-secondary">.</span></> : <>{belt.belt} belt<span className="text-white/40">.</span></>}
        </h2>
        <p className="mt-5 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/80">{belt.meaning}</p>
        <dl className="mt-8 grid max-w-md grid-cols-2 gap-x-8 gap-y-5 border-t border-white/15 pt-6 text-sm">
          <div>
            <dt className="text-white/60">Typical time</dt>
            <dd className="mt-1 text-base font-bold text-white">{belt.timeRequired}</dd>
          </div>
          <div>
            <dt className="text-white/60">Kata</dt>
            <dd className="mt-1 text-base font-bold text-white">{belt.kataCount}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-white/60">Focus</dt>
            <dd className="mt-1 text-base font-bold text-white">{belt.keyFocus}</dd>
          </div>
        </dl>
      </>
    );
  }
  const { rank } = step;
  return (
    <>
      <p className="flex items-center gap-3 text-sm font-semibold text-secondary">
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: Math.min(6, step.degree) }).map((_, i) => (
            <span key={i} className="h-3 w-1 bg-secondary" />
          ))}
        </span>
        {rank.dan}
      </p>
      <h2 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
        {rank.title}<span className="text-secondary">.</span>
      </h2>
      <p className="mt-5 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/80">{rank.note}</p>
      <p className="mt-8 border-t border-white/15 pt-6 text-sm text-white/60">
        Around <span className="text-base font-bold text-white">{rank.years} years</span> of training in total
      </p>
    </>
  );
}

/** The scroll-driven belt. Tall outer box, sticky stage, one step per ~70vh of scroll. */
function BeltJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  const sceneProps = useMemo(() => ({ progress: scrollYProgress, stops: STOPS }), [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const i = Math.round(v * (STEPS.length - 1));
    if (i !== active) setActive(i);
  });

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (travel * i) / (STEPS.length - 1), behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div ref={ref} data-bleed className="relative" style={{ height: `${STEPS.length * 70 + 30}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <SceneSlot
          scene="belt"
          sceneProps={sceneProps}
          className="absolute inset-0"
          fallback={
            <div className="absolute inset-0 flex items-center justify-end bg-black pr-[8vw]">
              <div className="h-6 w-[46vw] -rotate-12 rounded-sm ring-1 ring-white/20 transition-colors duration-700" style={{ backgroundColor: swatch(STOPS[active].color) }} />
            </div>
          }
        />
        {/* Copy legibility on narrow screens, where the belt sits above the text. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 via-40% to-transparent to-60% md:bg-gradient-to-r md:from-black/80 md:via-black/30 md:to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-4 pb-28 pt-32 sm:px-6 md:justify-center md:pb-0 lg:px-8">
          <div className="max-w-xl md:min-h-[26rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <StepCopy step={STEPS[active]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Rank rail: where you are on the path, and a way to jump. */}
        <nav aria-label="Ranks" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0">
          <ol className="flex gap-1 md:flex-col">
            {STEPS.map((step, i) => {
              const label = step.kind === 'intro' ? 'Introduction' : step.kind === 'kyu' ? `${step.belt.belt} belt` : step.rank.dan;
              const color = step.kind === 'intro' ? '#ffffff' : step.kind === 'kyu' ? swatch(step.belt.color) : '#d4a017';
              return (
                <li key={i}>
                  <button
                    onClick={() => goTo(i)}
                    aria-label={label}
                    aria-current={i === active ? 'step' : undefined}
                    className="group flex h-6 w-6 items-center justify-center md:h-6 md:w-11"
                  >
                    <span
                      className={`block rounded-sm ring-1 ring-white/25 transition-all duration-300 ${i === active ? 'h-4 w-2 md:h-2 md:w-8' : 'h-2 w-1.5 opacity-60 group-hover:opacity-100 md:h-1.5 md:w-4'}`}
                      style={{ backgroundColor: color }}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}

export default function BeltSystemPage() {
  const beltSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Kyokushin Karate Belt System — Complete Ranking Guide',
    description: 'Complete guide to the Kyokushin belt ranking system from White Belt to Black Belt.',
    author: { '@type': 'Organization', name: 'Kyokushin Karate Foundation of India' },
    publisher: {
      '@type': 'Organization',
      name: 'Kyokushin Karate Foundation of India',
      logo: { '@type': 'ImageObject', url: 'https://kyokushinfoundation.com/kkfi-logo.avif' },
    },
    datePublished: '2025-01-01',
    dateModified: '2026-02-15',
    mainEntityOfPage: 'https://kyokushinfoundation.com/belt-system',
  };

  return (
    // Transparent so the belt scene shows through from the canvas behind <main>.
    <div className="min-h-screen text-white selection:bg-primary selection:text-white">

      <BeltJourney />

      {/* After the hero: an element ahead of it blocks the hero's negative margin from collapsing, which shifted the page on load. */}
      <Script
        id="belt-system-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(beltSchema) }}
      />

      {/* The whole path on one page, for reading, printing, and screen readers. */}
      <Section rhythm="open" width="base" className="bg-black">
        <Reveal>
          <Heading>Every rank at a glance</Heading>
          <p className="mt-4 max-w-[56ch] text-lg leading-relaxed text-white/70">
            Ten kyu grades, worn as five coloured belts after white, lead to black belt and then the dan degrees. Times are typical for steady
            training three to four times a week.
          </p>
        </Reveal>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <caption className="sr-only">Kyokushin ranks, typical training time, and focus</caption>
            <thead>
              <tr className="border-b border-white/20 text-sm text-white/60">
                <th scope="col" className="py-3 pr-6 font-semibold">Rank</th>
                <th scope="col" className="py-3 pr-6 font-semibold">Grade</th>
                <th scope="col" className="py-3 pr-6 font-semibold">Typical time</th>
                <th scope="col" className="py-3 font-semibold">Focus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {BELTS.map((belt) => (
                <tr key={belt.belt}>
                  <th scope="row" className="py-4 pr-6">
                    <span className="flex items-center gap-3 font-bold text-white">
                      <span className="h-3 w-6 shrink-0 rounded-sm ring-1 ring-white/30" style={{ backgroundColor: swatch(belt.color) }} aria-hidden="true" />
                      {belt.belt}
                    </span>
                  </th>
                  <td className="py-4 pr-6 text-white/75">{belt.rank}</td>
                  <td className="py-4 pr-6 text-white/75">{belt.timeRequired}</td>
                  <td className="py-4 text-white/75">{belt.keyFocus}</td>
                </tr>
              ))}
              {DAN_RANKS.slice(1).map((rank) => (
                <tr key={rank.dan}>
                  <th scope="row" className="py-4 pr-6">
                    <span className="flex items-center gap-3 font-bold text-white">
                      <span className="h-3 w-6 shrink-0 rounded-sm bg-[#161616] ring-1 ring-secondary/60" aria-hidden="true" />
                      {rank.title}
                    </span>
                  </th>
                  <td className="py-4 pr-6 text-white/75">{rank.dan}</td>
                  <td className="py-4 pr-6 text-white/75">~{rank.years} years total</td>
                  <td className="py-4 text-white/75">{rank.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section rhythm="base" width="narrow" className="bg-black">
        <Reveal>
          <Heading>Common questions</Heading>
        </Reveal>
        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-2">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-lg font-bold text-white [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span aria-hidden="true" className="text-2xl font-light text-white/60 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[62ch] pb-5 text-pretty leading-relaxed text-white/75">{faq.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section rhythm="open" width="wide" className="bg-black">
        <Reveal kind="mask">
          <Heading size="display" className="max-w-[14ch] uppercase">
            Every black belt was a white belt who never quit<span className="text-primary">.</span>
          </Heading>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <BrandLink href="/find-a-dojo">Find a dojo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></BrandLink>
          <BrandLink href="/syllabus" variant="outline">Read the syllabus</BrandLink>
        </Reveal>
      </Section>
    </div>
  );
}
