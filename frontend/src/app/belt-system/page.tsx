'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Award, Clock, BookOpen, Swords, Shield } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

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
    rank: '10th Kyu (Mukyu)',
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
    rank: '9th Kyu',
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
    rank: '8th Kyu',
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
    rank: '7th Kyu',
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
    rank: '6th–5th Kyu',
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
    rank: '4th–1st Kyu',
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

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

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
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <Script
        id="belt-system-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(beltSchema) }}
      />

      {/* Hero */}
      <section className="relative pt-8 pb-12 md:pt-16 md:pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Award className="w-3.5 h-3.5" />
              {BELTS.length} Kyu Levels + {DAN_RANKS.length} Dan Ranks
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
              THE{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">BELT</span>{' '}
              SYSTEM
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              From White Belt to Black Belt — understand the Kyokushin ranking system, what each
              color represents, and the journey to mastery.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Belt Color Description */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="text-2xl md:text-3xl font-black tracking-tight mb-8 text-center"
          >
            KYU RANKS <span className="text-red-500">(COLOR BELTS)</span>
          </motion.h2>

          {/* Visual Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/20 via-red-500/30 to-black/0 hidden sm:block" />

            <div className="space-y-6">
              {BELTS.map((belt, i) => (
                <motion.div
                  key={belt.belt}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeIn}
                  custom={i}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-4 md:left-6 top-6 w-4 h-4 rounded-full border-2 border-zinc-800 z-10 hidden sm:block"
                    style={{ backgroundColor: belt.color === '#000000' ? '#ef4444' : belt.color }}
                  />

                  {/* Card */}
                  <div className={`sm:ml-16 md:ml-20 bg-zinc-900/50 border ${belt.borderClass} rounded-2xl p-5 md:p-6 hover:border-opacity-60 transition-all group`}>
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Belt color swatch */}
                      <div
                        className={`w-14 h-14 rounded-xl ${belt.bgClass} shrink-0 flex items-center justify-center shadow-lg ${
                          belt.belt === 'Black (Shodan)' ? 'border border-red-500/50' : ''
                        } ${belt.belt === 'White' ? 'border border-gray-400/30' : ''}`}
                      >
                        <span className={`text-lg font-black ${belt.belt === 'White' ? 'text-black' : 'text-white'}`}>
                          {i + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`text-xl font-black ${belt.textClass}`}>{belt.belt} Belt</h3>
                          <span className="text-xs text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">
                            {belt.rank}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed mb-3">
                          {belt.meaning}
                        </p>

                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-red-500" />
                            {belt.timeRequired}
                          </span>
                          <span className="inline-flex items-center gap-1 text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                            <BookOpen className="w-3 h-3 text-red-500" />
                            {belt.kataCount} Kata
                          </span>
                          <span className="inline-flex items-center gap-1 text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                            <Swords className="w-3 h-3 text-red-500" />
                            {belt.keyFocus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Belt Progression Bar */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-lg font-bold text-center text-gray-400 mb-6">Belt Progression at a Glance</h3>
          <div className="flex items-center gap-1 h-8 rounded-full overflow-hidden border border-white/5">
            {BELTS.map((belt, i) => (
              <div
                key={belt.belt}
                className="h-full flex-1 relative group cursor-default"
                style={{ backgroundColor: belt.color === '#000000' ? '#18181b' : belt.color }}
                title={`${belt.belt} Belt — ${belt.rank}`}
              >
                {belt.belt === 'Black (Shodan)' && (
                  <div className="absolute inset-0 border-2 border-red-500/50 rounded-r-full" />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`text-[10px] font-bold ${belt.belt === 'White' || belt.belt === 'Yellow' ? 'text-black' : 'text-white'} drop-shadow`}>
                    {belt.belt === 'Black (Shodan)' ? 'Black' : belt.belt}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
            <span>Beginner</span>
            <span>4–6 years →</span>
            <span>Black Belt</span>
          </div>
        </div>
      </section>

      {/* Dan Ranks */}
      <section className="px-4 pb-16 md:pb-24 bg-zinc-950/50">
        <div className="container mx-auto max-w-4xl py-12 md:py-16">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="text-2xl md:text-3xl font-black tracking-tight mb-3 text-center"
          >
            DAN RANKS <span className="text-red-500">(BLACK BELT DEGREES)</span>
          </motion.h2>
          <p className="text-gray-400 text-center mb-8 max-w-lg mx-auto text-sm">
            After achieving Shodan (1st Dan), the journey continues with increasingly demanding
            requirements for each degree.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAN_RANKS.map((rank, i) => (
              <motion.div
                key={rank.dan}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="bg-zinc-900/70 border border-red-500/10 rounded-xl p-5 hover:border-red-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-black border border-red-500/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm">{rank.dan}</h3>
                    <p className="text-xs text-red-400 font-semibold">{rank.title}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">{rank.note}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                  <Clock className="w-2.5 h-2.5" />
                  ~{rank.years} years total training
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-8 text-center">
            COMMON <span className="text-red-500">QUESTIONS</span>
          </h2>

          <div className="space-y-4">
            {[
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
                a: 'Yes! Children\'s classes adapt training intensity to their age. Full-contact sparring is introduced gradually from ages 8–10 with protective gear and supervision.',
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="bg-zinc-900/50 border border-white/5 rounded-xl p-5"
              >
                <h3 className="font-bold text-white text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-gradient-to-r from-red-600/10 via-red-600/5 to-red-600/10 border border-red-600/20 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              START YOUR BELT JOURNEY
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Every black belt was once a white belt who never quit. Begin your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/syllabus"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all active:scale-95"
              >
                View Full Syllabus <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/find-a-dojo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold transition-all"
              >
                Find a Dojo <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold transition-all"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
