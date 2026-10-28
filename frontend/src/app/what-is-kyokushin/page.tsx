'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/brand/PageHero';
import Section, { Heading } from '@/components/brand/Section';
import BrandLink from '@/components/brand/BrandLink';
import HistoryScroll, { type Chapter } from '@/components/learn/HistoryScroll';
import DojoKun from '@/components/learn/DojoKun';
import { loadDojos } from '@/components/home/film/dojos';

/*
 * Every factual line here is in the authenticity ledger
 * (docs/superpowers/specs/2026-10-19-full-site-redesign-design.md): sourced, or left out.
 * Legends are told as legends.
 */

const PRINCIPLES = [
  { kanji: '力', reading: 'Chikara', title: 'Strength', description: 'Physical and mental strength, built through full-contact training and conditioning.' },
  { kanji: '精神', reading: 'Seishin', title: 'Spirit', description: 'The Osu spirit: patience, determination, and not giving up.' },
  { kanji: '礼', reading: 'Rei', title: 'Respect', description: 'For instructors, training partners, the art, and oneself. "Osu" carries this too.' },
  { kanji: '規律', reading: 'Kiritsu', title: 'Discipline', description: 'Daily practice, dojo etiquette, and perseverance.' },
];

const METHODS = [
  { kanji: '基本', title: 'Kihon, basics', desc: 'Punches, kicks, blocks and stances, repeated until they are second nature.' },
  { kanji: '型', title: 'Kata, forms', desc: 'Set sequences that carry fighting principles and breathing, from the Taikyoku kata through the Pinan series, Sanchin and beyond.' },
  { kanji: '組手', title: 'Kumite, sparring', desc: 'Full-contact fighting: strikes to the body and legs and kicks to the head. No hand strikes to the head or face.' },
  { kanji: '鍛練', title: 'Tanren, conditioning', desc: 'Strength, endurance and body conditioning, so the body can give and take full-contact strikes.' },
  { kanji: '試し割り', title: 'Tameshiwari, breaking', desc: 'Breaking boards and other materials with bare hands and feet, as a test of power, technique and focus.' },
];

const BENEFITS = [
  { title: 'Self-defence', description: 'Skills tested against resisting partners, not only in the air.' },
  { title: 'Fitness', description: 'Strength, flexibility, endurance and conditioning in every class.' },
  { title: 'Resilience', description: 'Hard training, done with others, builds focus and a steady mind.' },
  { title: 'Confidence', description: 'The quiet kind that comes from knowing what you can do.' },
  { title: 'Discipline', description: 'Regular practice, goals set one grading at a time, and dojo etiquette.' },
  { title: 'Community', description: 'Training partners in your dojo, and a Kyokushin family across India and the world.' },
];

// Only rows that describe the rules themselves; no rankings or timelines we cannot source.
const COMPARISON = [
  { aspect: 'Contact', kyokushin: 'Full contact, knockdown rules', pointStyles: 'Light or controlled contact' },
  { aspect: 'Sparring', kyokushin: 'Full-power strikes to the body and legs, kicks to the head', pointStyles: 'Controlled techniques scored for points' },
  { aspect: 'Hand strikes to the head', kyokushin: 'Not allowed', pointStyles: 'Allowed, controlled, to score' },
  { aspect: 'How a fight is won', kyokushin: 'Knockdown, or the judges’ decision', pointStyles: 'Points' },
];

const BASE_CHAPTERS: Chapter[] = [
  { year: '1923', title: 'Mas Oyama is born', image: '/history/oyama.jpg', alt: 'Sosai Masutatsu Oyama in his gi, seated', body: 'Born Choi Yeong-eui in Korea, he moved to Japan as a young man and trained in karate, including under Gichin Funakoshi, the founder of Shotokan, and in Goju-ryu.' },
  { year: '1940s', title: 'The mountain', image: '/history/solitude.jpg', alt: 'A lone karateka training in the half light', body: 'He went into the mountains to train alone, most famously on Mount Minobu, a period that became the root of Kyokushin’s training culture.' },
  { year: '1950s', title: 'Demonstrations', image: '/history/kick.jpg', alt: 'A karateka throwing a high kick', body: 'He toured Japan and abroad demonstrating karate and testing it against other fighters. By his own account he fought bulls barehanded, the story that made his name.' },
  { year: '1964', title: 'Kyokushinkaikan', image: '/history/belt-grip.jpg', alt: 'A hand gripping a black belt', body: 'He founded the International Karate Organization Kyokushinkaikan, with its headquarters dojo in Ikebukuro, Tokyo. The name had been in use since the late 1950s: 極真, the ultimate truth.' },
  { year: '1975', title: 'The world open', image: '/history/kumite-today.jpg', alt: 'Two karateka in a full-contact bout', body: 'The first World Open Karate Tournament was held in Tokyo, under the knockdown rules Kyokushin is known for.' },
  { year: '1994', title: 'The founder dies', image: '/history/oyama.jpg', alt: 'Sosai Masutatsu Oyama in his gi, seated', body: 'Sosai Oyama died in April 1994. Kyokushin later divided into several organisations, each carrying his karate forward.' },
  { year: '2013', title: 'KKFI in India', image: '/history/shihan-vasant.jpg', alt: 'Shihan Vasant Kumar Singh', body: 'Shihan Vasant Kumar Singh founded the Kyokushin Karate Foundation of India, headquartered in Shuklaganj, Uttar Pradesh, and part of World Kyokushin Kaikan under Daihyo Ryuko Take.' },
];

/** Today's chapter, counted from the live dojo list rather than written down. */
function useToday(): Chapter {
  const [count, setCount] = useState<{ dojos: number; cities: number } | null>(null);
  useEffect(() => {
    loadDojos()
      .then((d) => setCount({ dojos: d.length, cities: new Set(d.map((x) => x.city?.trim()).filter(Boolean)).size }))
      .catch(() => setCount(null));
  }, []);
  return useMemo(
    () => ({
      year: 'Today',
      title: 'One syllabus, every dojo',
      image: '/history/grading-floor.jpg',
      alt: 'Karateka lined up on the floor at a KKFI grading',
      body: count
        ? `${count.dojos} KKFI dojos in ${count.cities} cities train to one syllabus, grade to one standard and fight full-contact kumite.`
        : 'KKFI dojos across India train to one syllabus, grade to one standard and fight full-contact kumite.',
    }),
    [count],
  );
}

export default function WhatIsKyokushinPage() {
  const today = useToday();
  const chapters = useMemo(() => [...BASE_CHAPTERS, today], [today]);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What is Kyokushin karate?',
    description: 'Kyokushin, the full-contact karate founded by Sosai Masutatsu Oyama: its history, principles, training and the Dojo Kun.',
    author: { '@type': 'Organization', name: 'Kyokushin Karate Foundation of India' },
    publisher: {
      '@type': 'Organization',
      name: 'Kyokushin Karate Foundation of India',
      logo: { '@type': 'ImageObject', url: 'https://www.kyokushinfoundation.com/kkfi-logo.avif' },
    },
    datePublished: '2025-01-01',
    dateModified: '2026-10-19',
    mainEntityOfPage: 'https://www.kyokushinfoundation.com/what-is-kyokushin',
  };

  return (
    <div className="min-h-screen bg-night text-canvas">
      <PageHero
        mark="極真"
        height="screen"
        title="What is Kyokushin karate?"
        lede="Full-contact karate, founded by Sosai Masutatsu Oyama. Its name means the ultimate truth. Scroll to walk through its history."
        media={
          // eslint-disable-next-line @next/next/no-img-element
 <img src="/history/kumite-today.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 " />
        }
      />

      <Script id="article-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <HistoryScroll chapters={chapters} label="The history of Kyokushin" />

      <Section rhythm="open" width="narrow" className="bg-night">
        <Heading>The ultimate truth</Heading>
        <div className="mt-8 space-y-6 text-pretty font-gothic text-lg leading-[1.6] text-ash">
          <p>
            <strong className="text-canvas">Kyokushin (極真)</strong> means &quot;the ultimate truth&quot;. It is the karate of
            <strong className="text-canvas"> Sosai Masutatsu Oyama</strong>, and it is often called the strongest karate.
          </p>
          <p>
            Where point styles pull or control their strikes, Kyokushin trains and competes with
            <strong className="text-canvas"> full-power strikes</strong> to the body and legs, and kicks to the head, under knockdown
            rules. Hand strikes to the head are not allowed.
          </p>
          <p>
            In India, the{' '}
            <Link href="/intro" className="text-canvas underline decoration-dan-gold decoration-1 underline-offset-4">
              Kyokushin Karate Foundation of India
            </Link>{' '}
            carries this karate under Shihan Vasant Kumar Singh.
          </p>
        </div>
      </Section>

      <Section rhythm="base" width="wide" className="bg-night">
        <Heading>Four principles</Heading>
        <div className="mt-14 grid gap-x-12 gap-y-16 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="border-t border-worn-belt pt-8">
              <p lang="ja" aria-hidden="true" className="font-mincho text-[clamp(4rem,10vw,7.5rem)] font-extrabold leading-none text-canvas">{p.kanji}</p>
              <h3 className="mt-6 font-mincho text-[1.563rem] font-extrabold text-canvas">
                {p.title}, <span className="font-gothic text-base font-normal text-ash">{p.reading}</span>
              </h3>
              <p className="mt-3 max-w-[44ch] font-gothic leading-[1.6] text-ash">{p.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section rhythm="base" width="base" className="bg-night">
        <Heading>How we train</Heading>
        <ul className="mt-12 divide-y divide-worn-belt border-y border-worn-belt">
          {METHODS.map((m) => (
            <li key={m.title} className="grid gap-3 py-8 md:grid-cols-[10rem_16rem_1fr] md:gap-8">
              <span lang="ja" aria-hidden="true" className="font-mincho text-4xl font-extrabold text-ash">{m.kanji}</span>
              <h3 className="font-mincho text-[1.25rem] font-extrabold text-canvas">{m.title}</h3>
              <p className="max-w-[60ch] font-gothic leading-[1.6] text-ash">{m.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section rhythm="base" width="base" className="bg-night">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <Heading>Why people train</Heading>
            <p className="mt-4 font-gothic text-ash">Adults, children and families.</p>
          </div>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title}>
                <dt className="font-gothic font-bold text-canvas">{b.title}</dt>
                <dd className="mt-2 font-gothic leading-[1.6] text-ash">{b.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section rhythm="base" width="base" className="bg-night">
        <Heading>Kyokushin and point styles</Heading>
        <p className="mt-4 max-w-[56ch] font-gothic text-ash">How knockdown karate differs from styles that score points.</p>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left font-gothic">
            <thead>
              <tr className="border-b border-worn-belt text-sm text-ash">
                <th scope="col" className="py-3 pr-6 font-normal">&nbsp;</th>
                <th scope="col" className="py-3 pr-6 font-bold text-canvas">Kyokushin</th>
                <th scope="col" className="py-3 font-normal">Point styles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-worn-belt">
              {COMPARISON.map((row) => (
                <tr key={row.aspect}>
                  <th scope="row" className="py-4 pr-6 font-normal text-ash">{row.aspect}</th>
                  <td className="py-4 pr-6 font-bold text-canvas">{row.kyokushin}</td>
                  <td className="py-4 text-ash">{row.pointStyles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <DojoKun />

      <Section rhythm="open" width="wide" className="bg-night">
        <Heading size="display" className="max-w-[12ch]">Begin where every master began.</Heading>
        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
          <BrandLink href="/find-a-dojo">Find a dojo</BrandLink>
          <BrandLink href="/belt-system" variant="outline">See the belt path</BrandLink>
        </div>
      </Section>
    </div>
  );
}
