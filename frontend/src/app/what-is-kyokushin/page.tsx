'use client';

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import { useMemo, useRef, useState } from 'react';
import SceneSlot from '@/components/three/SceneSlot';
import Reveal from '@/components/brand/Reveal';
import Section, { Heading } from '@/components/brand/Section';
import BrandLink from '@/components/brand/BrandLink';

const PRINCIPLES = [
  { kanji: '力', reading: 'Chikara', title: 'Strength', description: 'Physical and mental strength forged through rigorous full-contact training and conditioning.' },
  { kanji: '精神', reading: 'Seishin', title: 'Spirit', description: 'The indomitable Osu spirit — never giving up, always pushing beyond limits.' },
  { kanji: '礼', reading: 'Rei', title: 'Respect', description: 'Deep respect for instructors, training partners, the art, and oneself. "Osu" embodies this.' },
  { kanji: '規律', reading: 'Kiritsu', title: 'Discipline', description: 'Self-discipline cultivated through daily practice, strict etiquette, and perseverance.' },
];

const BENEFITS = [
  { title: 'Self-Defense', description: 'Practical, real-world combat skills with full-contact training.' },
  { title: 'Physical Fitness', description: 'Full-body conditioning — strength, flexibility, cardio, and endurance.' },
  { title: 'Mental Toughness', description: 'Develop resilience, focus, and an unbreakable spirit through demanding training.' },
  { title: 'Confidence', description: 'Knowing you can defend yourself builds deep, genuine confidence.' },
  { title: 'Discipline & Focus', description: 'Structured training teaches time management, goal-setting, and concentration.' },
  { title: 'Community', description: 'Join a worldwide brotherhood of 12 million+ practitioners across 120+ countries.' },
];

const COMPARISON = [
  { aspect: 'Contact Level', kyokushin: 'Full-contact', shotokan: 'No/light contact', others: 'Varies' },
  { aspect: 'Sparring', kyokushin: 'Full-power strikes to body & legs', shotokan: 'Controlled point-fighting', others: 'Light contact' },
  { aspect: 'Focus', kyokushin: 'Practical combat + conditioning', shotokan: 'Form + technique precision', others: 'Varies by school' },
  { aspect: 'Fitness Level', kyokushin: 'Extremely demanding', shotokan: 'Moderate', others: 'Moderate' },
  { aspect: 'Head Punches', kyokushin: 'Not allowed (kicks allowed)', shotokan: 'Controlled, to score', others: 'Varies' },
  { aspect: 'Black Belt Time', kyokushin: '4-6 years', shotokan: '3-5 years', others: '2-5 years' },
];

const CHAPTERS = [
  { year: '1923', title: 'Birth of Mas Oyama', image: '/history/oyama.jpg', desc: 'Born Choi Yeong-eui in Korea, he would later move to Japan and dedicate his life to martial arts, training under Gichin Funakoshi (Shotokan) and Gōju-ryū masters.' },
  { year: '1947–49', title: 'Mountain training', image: '/history/solitude.jpg', desc: 'Oyama retreated to Mt. Minobu for 18 months of intense solitary training — meditating under waterfalls, breaking rocks, and fighting nature. This forged his legendary toughness.' },
  { year: '1950s', title: 'The bull fighter', image: '/history/kick.jpg', desc: 'Oyama famously fought 52 bulls, killing 3 instantly with bare-hand strikes, earning the nickname "Godhand." He toured the world challenging fighters of all martial arts.' },
  { year: '1964', title: 'Kyokushinkaikan founded', image: '/history/belt-grip.jpg', desc: 'Oyama established the International Karate Organization Kyokushinkaikan in Tokyo. The style emphasised full-contact fighting, extreme conditioning, and the Osu spirit.' },
  { year: '2013', title: 'The foundation in India', image: '/history/shihan-vasant.jpg', desc: 'Shihan Vasant Kumar Singh, training since 1987, founded the Kyokushin Karate Foundation of India to bring authentic Kyokushin to the country.' },
  { year: 'Today', title: '12 million, 120 countries', image: '/history/grading-floor.jpg', desc: 'One of the largest martial arts organisations in the world. In India, KKFI dojos carry the same syllabus, the same gradings, and the same full-contact kumite.' },
];

const INTRO_IMAGE = '/history/kumite-today.jpg';
const IMAGES = [INTRO_IMAGE, ...CHAPTERS.map((c) => c.image)];

const METHODS = [
  { kanji: '基本', title: 'Kihon — basics', desc: 'Fundamental techniques: punches, kicks, blocks, and stances practiced thousands of times to build muscle memory and perfect form.' },
  { kanji: '型', title: 'Kata — forms', desc: 'Predetermined sequences of movements that encode fighting principles, breathing patterns, and self-defense applications. From Taikyoku to advanced Pinan and Sanchin kata.' },
  { kanji: '組手', title: 'Kumite — sparring', desc: 'Full-contact fighting with full-power strikes to the body and legs. No face punches allowed, but head kicks are permitted. This is what sets Kyokushin apart.' },
  { kanji: '鍛練', title: 'Tanren — conditioning', desc: 'Extreme physical conditioning — hundreds of push-ups, sit-ups, squats, body hardening drills, and endurance training. Kyokushin fighters are among the fittest martial artists.' },
  { kanji: '試し割り', title: 'Tameshiwari — breaking', desc: 'Breaking boards, bats, ice, and stones with bare hands and feet. Tests power generation, technique, and mental focus.' },
];

const DOJO_KUN = [
  { jp: '一、我々は心身を錬磨し', en: 'We will train our hearts and bodies for a firm, unshaking spirit.' },
  { jp: '一、我々は武の真髄を極め', en: 'We will pursue the true meaning of the martial way.' },
  { jp: '一、我々は質実剛健を以って', en: 'With true vigor, we will cultivate a spirit of self-discipline.' },
  { jp: '一、我々は礼節を重んじ', en: 'We will observe the rules of courtesy, respect our superiors, and refrain from violence.' },
  { jp: '一、我々は神仏を尊び', en: 'We will follow our religious principles and never forget the true virtue of humility.' },
  { jp: '一、我々は知性と体力とを向上させ', en: 'We will look upwards in wisdom and strength, not seeking other desires.' },
  { jp: '一、我々は生涯の修行を空手の道に通じ', en: 'All our lives, through the discipline of karate, we will seek to fulfill the true meaning of the Kyokushin way.' },
];

/** Opening corridor: the page title, then one chapter of the history per print. */
function HistoryJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  const sceneProps = useMemo(() => ({ progress: scrollYProgress, images: IMAGES }), [scrollYProgress]);
  const steps = IMAGES.length;

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const i = Math.round(v * (steps - 1));
    if (i !== active) setActive(i);
  });

  // Copy sits opposite the print: prints alternate right/left, starting right.
  const copyRight = active % 2 === 1;
  const chapter = active > 0 ? CHAPTERS[active - 1] : null;

  return (
    <div ref={ref} data-bleed className="relative" style={{ height: `${steps * 75 + 25}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <SceneSlot
          scene="history"
          sceneProps={sceneProps}
          className="absolute inset-0"
          fallback={
            <div className="absolute inset-0 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMAGES[active]} alt="" className="absolute inset-y-[12%] right-[6%] h-[76%] w-auto max-w-[50%] rounded-sm object-cover opacity-70 grayscale md:block" />
            </div>
          }
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 via-40% to-transparent to-70% md:hidden" />

        <div className={`relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-4 pb-28 pt-32 sm:px-6 md:justify-center md:pb-0 lg:px-8 ${copyRight ? 'md:items-end' : ''}`}>
          <div className="max-w-xl md:min-h-[24rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {chapter ? (
                  <>
                    <p className="text-[clamp(3.5rem,9vw,7rem)] font-black leading-none tracking-[-0.04em] text-white/15">{chapter.year}</p>
                    <h2 className="-mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white md:-mt-6">
                      {chapter.title}
                    </h2>
                    <p className="mt-6 max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80">{chapter.desc}</p>
                  </>
                ) : (
                  <>
                    <p className="mb-5 flex items-center gap-3 text-sm font-semibold text-white/75">
                      <span lang="ja" className="text-2xl font-black text-primary-light">極真</span>
                      <span>The ultimate truth</span>
                    </p>
                    <h1 className="text-[clamp(2.75rem,7.5vw,5.75rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                      What is Kyokushin karate<span className="text-primary">?</span>
                    </h1>
                    <p className="mt-6 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                      The world&apos;s strongest full-contact karate, forging fighters of unbreakable spirit
                      since 1964. Scroll to walk through its history.
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatIsKyokushinPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What is Kyokushin Karate? – A Complete Guide',
    description:
      'Learn about Kyokushin Karate — the world\'s strongest full-contact karate style. History, philosophy, training methods, and how to start.',
    author: {
      '@type': 'Organization',
      name: 'Kyokushin Karate Foundation of India',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kyokushin Karate Foundation of India',
      logo: { '@type': 'ImageObject', url: 'https://kyokushinfoundation.com/kkfi-logo.avif' },
    },
    datePublished: '2025-01-01',
    dateModified: '2026-02-15',
    mainEntityOfPage: 'https://kyokushinfoundation.com/what-is-kyokushin',
  };

  return (
    // Transparent so the history scene shows through from the canvas behind <main>.
    <div className="min-h-screen text-white selection:bg-primary selection:text-white">

      <HistoryJourney />

      {/* After the hero: an element ahead of it blocks the hero's negative margin from collapsing, which shifted the page on load. */}
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* The history, readable in full without the scroll scene. */}
      <ol className="sr-only">
        {CHAPTERS.map((c) => (
          <li key={c.year}>{c.year}: {c.title}. {c.desc}</li>
        ))}
      </ol>

      <Section rhythm="open" width="narrow" className="bg-black">
        <Reveal>
          <Heading>The ultimate full-contact karate</Heading>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 space-y-6 text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
          <p>
            <strong className="text-white">Kyokushin (極真)</strong> literally means &quot;the ultimate truth&quot;
            in Japanese. Founded by <strong className="text-white">Sosai Masutatsu Oyama</strong> in 1964, it is
            renowned as the most rigorous and combat-effective style of karate in existence.
          </p>
          <p>
            Unlike point-fighting styles where strikes are pulled or barely make contact, Kyokushin
            practitioners train and compete with <strong className="text-white">full-power strikes</strong> to
            the body and legs. This creates fighters who are not only technically skilled but also
            physically tough and mentally resilient.
          </p>
          <p>
            Today Kyokushin has <strong className="text-white">over 12 million practitioners across 120+ countries</strong>.
            In India, the{' '}
            <Link href="/intro" className="font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 hover:text-primary-light">
              Kyokushin Karate Foundation of India
            </Link>{' '}
            continues this legacy under the guidance of Shihan Vasant Kumar Singh.
          </p>
        </Reveal>
      </Section>

      {/* Four principles, carried by their characters. */}
      <Section rhythm="base" width="wide" className="bg-black">
        <Reveal>
          <Heading>Four principles</Heading>
        </Reveal>
        <div className="mt-14 grid gap-x-12 gap-y-16 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} kind="depth" delay={i * 0.08} className="border-t border-white/15 pt-8">
              <p lang="ja" aria-hidden="true" className="text-[clamp(4rem,10vw,7.5rem)] font-black leading-none text-white/90">{p.kanji}</p>
              <h3 className="mt-6 text-2xl font-extrabold text-white">
                {p.title} <span className="font-semibold text-white/60">· {p.reading}</span>
              </h3>
              <p className="mt-3 max-w-[44ch] leading-relaxed text-white/75">{p.description}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section rhythm="base" width="base" className="bg-black">
        <Reveal>
          <Heading>How we train</Heading>
        </Reveal>
        <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {METHODS.map((m, i) => (
            <Reveal as="li" key={m.title} delay={i * 0.05} className="grid gap-3 py-8 md:grid-cols-[10rem_16rem_1fr] md:gap-8">
              <span lang="ja" aria-hidden="true" className="text-4xl font-black text-white/40">{m.kanji}</span>
              <h3 className="text-xl font-extrabold text-white">{m.title}</h3>
              <p className="max-w-[60ch] leading-relaxed text-white/75">{m.desc}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section rhythm="base" width="base" className="bg-black">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal>
            <Heading>Why people train</Heading>
            <p className="mt-4 text-lg text-white/70">For adults, children, and families.</p>
          </Reveal>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.05}>
                <dt className="text-lg font-extrabold text-white">{b.title}</dt>
                <dd className="mt-2 leading-relaxed text-white/75">{b.description}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </Section>

      <Section rhythm="base" width="base" className="bg-black">
        <Reveal>
          <Heading>Kyokushin and other styles</Heading>
          <p className="mt-4 max-w-[56ch] text-lg text-white/70">How Kyokushin compares to Shotokan and other popular karate styles.</p>
        </Reveal>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-white/20 text-sm text-white/60">
                <th scope="col" className="py-3 pr-6 font-semibold">Aspect</th>
                <th scope="col" className="py-3 pr-6 font-semibold text-white">Kyokushin</th>
                <th scope="col" className="py-3 pr-6 font-semibold">Shotokan</th>
                <th scope="col" className="py-3 font-semibold">Others</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {COMPARISON.map((row) => (
                <tr key={row.aspect}>
                  <th scope="row" className="py-4 pr-6 font-semibold text-white/75">{row.aspect}</th>
                  <td className="py-4 pr-6 font-bold text-white">{row.kyokushin}</td>
                  <td className="py-4 pr-6 text-white/70">{row.shotokan}</td>
                  <td className="py-4 text-white/70">{row.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* The Dojo Kun is recited in order, so it stays an ordered list. */}
      <Section rhythm="open" width="base" className="bg-black">
        <Reveal>
          <Heading>The Dojo Kun</Heading>
          <p className="mt-4 text-lg text-white/70">Recited at the end of every training session.</p>
        </Reveal>
        <ol className="mt-14 space-y-10">
          {DOJO_KUN.map((line, i) => (
            <Reveal as="li" key={line.jp} kind="focus" delay={i * 0.04} className="grid gap-2 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-12">
              <p lang="ja" className="text-xl font-bold text-white/55 md:text-2xl">{line.jp}</p>
              <p className="text-pretty text-xl font-extrabold leading-snug text-white md:text-2xl">{line.en}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section rhythm="open" width="wide" className="bg-black">
        <Reveal kind="mask">
          <Heading size="display" className="max-w-[12ch] uppercase">
            Begin where every master began<span className="text-primary">.</span>
          </Heading>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <BrandLink href="/find-a-dojo">Find a dojo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></BrandLink>
          <BrandLink href="/belt-system" variant="outline">See the belt path</BrandLink>
        </Reveal>
      </Section>
    </div>
  );
}
