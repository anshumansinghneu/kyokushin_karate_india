'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, Flame, Users, Heart, Award, BookOpen, Swords, Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

const PRINCIPLES = [
  {
    icon: Shield,
    title: 'Strength (力 Chikara)',
    description: 'Physical and mental strength forged through rigorous full-contact training and conditioning.',
  },
  {
    icon: Flame,
    title: 'Spirit (精神 Seishin)',
    description: 'The indomitable Osu spirit — never giving up, always pushing beyond limits.',
  },
  {
    icon: Heart,
    title: 'Respect (礼 Rei)',
    description: 'Deep respect for instructors, training partners, the art, and oneself. "Osu" embodies this.',
  },
  {
    icon: Target,
    title: 'Discipline (規律 Kiritsu)',
    description: 'Self-discipline cultivated through daily practice, strict etiquette, and perseverance.',
  },
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

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

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
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Hero */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Complete Guide
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
              WHAT IS{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                KYOKUSHIN
              </span>{' '}
              KARATE?
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The world&apos;s strongest full-contact karate style — forging fighters of
              unbreakable spirit since 1964.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
            custom={0}
            className="prose prose-invert prose-lg max-w-none"
          >
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
                The Ultimate Full-Contact Karate
              </h2>
              <p className="text-gray-300 leading-relaxed text-base md:text-lg mb-4">
                <strong className="text-white">Kyokushin (極真)</strong> literally means
                &quot;the ultimate truth&quot; in Japanese. Founded by{' '}
                <strong className="text-white">Sosai Masutatsu Oyama</strong> in 1964, Kyokushin is
                renowned as the most rigorous and combat-effective style of karate in existence.
              </p>
              <p className="text-gray-300 leading-relaxed text-base md:text-lg mb-4">
                Unlike point-fighting styles where strikes are pulled or barely make contact,
                Kyokushin practitioners train and compete with <strong className="text-white">full-power
                strikes</strong> to the body and legs. This creates fighters who are not only
                technically skilled but also physically tough and mentally resilient.
              </p>
              <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                Today, Kyokushin has grown into one of the largest martial arts organizations in the
                world, with <strong className="text-white">over 12 million practitioners across 120+ countries</strong>.
                In India, the{' '}
                <Link href="/intro" className="text-red-400 hover:text-red-300 font-bold no-underline">
                  Kyokushin Karate Foundation of India (KKFI)
                </Link>{' '}
                continues this legacy under the guidance of Shihan Vasant Kumar Singh.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* History */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center">
              THE <span className="text-red-500">HISTORY</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                year: '1923',
                title: 'Birth of Mas Oyama',
                desc: 'Born Choi Yeong-eui in Korea, he would later move to Japan and dedicate his life to martial arts, training under Gichin Funakoshi (Shotokan) and Gōju-ryū masters.',
              },
              {
                year: '1947–1949',
                title: 'Mountain Training',
                desc: 'Oyama retreated to Mt. Minobu for 18 months of intense solitary training — meditating under waterfalls, breaking rocks, and fighting nature. This forged his legendary toughness.',
              },
              {
                year: '1950s',
                title: 'The Bull Fighter',
                desc: 'Oyama famously fought 52 bulls, killing 3 instantly with bare-hand strikes, earning the nickname "Godhand." He toured the world challenging fighters of all martial arts.',
              },
              {
                year: '1964',
                title: 'Kyokushinkaikan Founded',
                desc: 'Oyama established the International Karate Organization Kyokushinkaikan in Tokyo. The style emphasised full-contact fighting, extreme conditioning, and the Osu spirit.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.year}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-red-500/20 transition-all"
              >
                <span className="text-red-500 font-black text-3xl">{item.year}</span>
                <h3 className="text-lg font-bold text-white mt-2 mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
          >
            CORE <span className="text-red-500">PRINCIPLES</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-red-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
                  <p.icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Methods */}
      <section className="px-4 pb-16 md:pb-24 bg-zinc-950/50">
        <div className="container mx-auto max-w-4xl py-12 md:py-16">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
          >
            TRAINING <span className="text-red-500">METHODS</span>
          </motion.h2>

          <div className="space-y-4">
            {[
              {
                icon: Swords,
                title: 'Kihon (基本) — Basics',
                desc: 'Fundamental techniques: punches, kicks, blocks, and stances practiced thousands of times to build muscle memory and perfect form.',
              },
              {
                icon: BookOpen,
                title: 'Kata (型) — Forms',
                desc: 'Predetermined sequences of movements that encode fighting principles, breathing patterns, and self-defense applications. From Taikyoku to advanced Pinan and Sanchin kata.',
              },
              {
                icon: Users,
                title: 'Kumite (組手) — Sparring',
                desc: 'Full-contact fighting with full-power strikes to the body and legs. No face punches allowed, but head kicks are permitted. This is what sets Kyokushin apart.',
              },
              {
                icon: Flame,
                title: 'Conditioning (鍛練 Tanren)',
                desc: 'Extreme physical conditioning — hundreds of push-ups, sit-ups, squats, body hardening drills, and endurance training. Kyokushin fighters are among the fittest martial artists.',
              },
              {
                icon: Target,
                title: 'Tameshiwari (試し割り) — Breaking',
                desc: 'Breaking boards, bats, ice, and stones with bare hands and feet. Tests power generation, technique, and mental focus.',
              },
            ].map((method, i) => (
              <motion.div
                key={method.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="flex gap-4 bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0 mt-0.5">
                  <method.icon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{method.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{method.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-center"
          >
            WHY TRAIN <span className="text-red-500">KYOKUSHIN</span>?
          </motion.h2>
          <p className="text-gray-400 text-center mb-8 max-w-lg mx-auto">
            Benefits for adults, children, and families.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all"
              >
                <Award className="w-5 h-5 text-red-500 mb-3" />
                <h3 className="font-bold text-white text-sm mb-1">{b.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-center"
          >
            KYOKUSHIN vs <span className="text-red-500">OTHER STYLES</span>
          </motion.h2>
          <p className="text-gray-400 text-center mb-8 max-w-lg mx-auto">
            How Kyokushin compares to Shotokan and other popular karate styles.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900">
                  <th className="text-left p-4 text-gray-400 font-bold">Aspect</th>
                  <th className="text-left p-4 text-red-400 font-bold">Kyokushin</th>
                  <th className="text-left p-4 text-gray-400 font-bold">Shotokan</th>
                  <th className="text-left p-4 text-gray-400 font-bold">Others</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.aspect} className={i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/50'}>
                    <td className="p-4 text-gray-400 font-semibold">{row.aspect}</td>
                    <td className="p-4 text-white font-semibold">{row.kyokushin}</td>
                    <td className="p-4 text-gray-400">{row.shotokan}</td>
                    <td className="p-4 text-gray-400">{row.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The Dojo Kun */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            className="bg-gradient-to-b from-red-600/5 to-transparent border border-red-600/10 rounded-2xl p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-6">
              THE DOJO <span className="text-red-500">KUN</span>
            </h2>
            <p className="text-gray-400 text-sm mb-6">Recited at the end of every training session:</p>

            <div className="space-y-4 text-left max-w-md mx-auto">
              {[
                { jp: '一、我々は心身を錬磨し', en: 'We will train our hearts and bodies for a firm, unshaking spirit.' },
                { jp: '一、我々は武の真髄を極め', en: 'We will pursue the true meaning of the martial way.' },
                { jp: '一、我々は質実剛健を以って', en: 'With true vigor, we will cultivate a spirit of self-discipline.' },
                { jp: '一、我々は礼節を重んじ', en: 'We will observe the rules of courtesy, respect our superiors, and refrain from violence.' },
                { jp: '一、我々は神仏を尊び', en: 'We will follow our religious principles and never forget the true virtue of humility.' },
                { jp: '一、我々は知性と体力とを向上させ', en: 'We will look upwards in wisdom and strength, not seeking other desires.' },
                { jp: '一、我々は生涯の修行を空手の道に通じ', en: 'All our lives, through the discipline of karate, we will seek to fulfill the true meaning of the Kyokushin way.' },
              ].map((line, i) => (
                <div key={i} className="border-l-2 border-red-600/30 pl-4">
                  <p className="text-xs text-red-400/70 font-mono">{line.jp}</p>
                  <p className="text-sm text-gray-300 mt-0.5">{line.en}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-gradient-to-r from-red-600/10 via-red-600/5 to-red-600/10 border border-red-600/20 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              READY TO START?
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Find a dojo near you and begin your Kyokushin journey. OSU!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/find-a-dojo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all active:scale-95"
              >
                Find a Dojo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/syllabus"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold transition-all"
              >
                View Syllabus <ChevronRight className="w-4 h-4" />
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
