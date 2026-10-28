import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/brand/Reveal';
import { SYLLABUS } from '@/lib/syllabus';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede } from '../_components/article';

const guide = GUIDES[3];

/** Belt cloth colours for the swatches; black is lifted off pure black so it reads. */
const SWATCH: Record<string, string> = {
  White: '#f5f5f5',
  Orange: '#f97316',
  Blue: '#2563eb',
  Yellow: '#facc15',
  Green: '#16a34a',
  Brown: '#92400e',
  Black: '#161616',
};

/** Kyu and dan grade for each belt, as on /belt-system. */
const RANK: Record<string, string> = {
  White: 'Mukyu (ungraded)',
  Orange: '10th–9th Kyu',
  Blue: '8th–7th Kyu',
  Yellow: '6th–5th Kyu',
  Green: '4th–3rd Kyu',
  Brown: '2nd–1st Kyu',
  Black: 'Shodan (1st Dan)',
};

/** Names only: KKFI's requirements and titles for each dan are not published until KKFI confirms them. */
const DAN_NAMES = ['Shodan', 'Nidan', 'Sandan', 'Yondan', 'Godan', 'Rokudan', 'Nanadan', 'Hachidan', 'Kyudan', 'Judan'];
const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

export const metadata: Metadata = {
  title: 'Kyokushin Grading Syllabus 2026 | Belt Ranks & Kata Guide',
  description: 'The KKFI Kyokushin karate grading syllabus: belt order from white to black, the kyu grades and the kata for each belt. A guide by the Kyokushin Karate Foundation of India (KKFI).',
  keywords: [
    'Kyokushin grading syllabus 2026',
    'Kyokushin belt ranks',
    'karate belt order',
    'Kyokushin kata requirements',
    'karate promotion test India',
    'Kyokushin kyu grades',
    'karate grading requirements',
    'full contact karate belts',
    'KKFI belt promotion',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/blog/kyokushin-grading-syllabus-2026',
  },
  openGraph: {
    title: 'Kyokushin Grading Syllabus 2026: Belt Guide',
    description: 'The KKFI Kyokushin belt syllabus, from white belt to black belt: kyu grades and the kata for each belt.',
    type: 'article',
    publishedTime: '2026-02-13T00:00:00.000Z',
    authors: ['Kyokushin Karate Foundation of India'],
    tags: ['Grading', 'Syllabus', 'Belt Ranks', 'Kyokushin', 'Karate'],
  },
};

export default function GradingSyllabus2026() {
  return (
    <article className="min-h-screen text-white">
      <ArticleHero
        kanji="帯"
        category={guide.category}
        title="Kyokushin Grading Syllabus 2026"
        subtitle="The KKFI belt ranks and their kata"
        image={guide.image}
        imageAlt={guide.imageAlt}
        meta={
          <>
            <span>Published {guide.date}</span>
            <span aria-hidden="true" className="text-white/30">/</span>
            <span>By {AUTHOR}</span>
          </>
        }
      />

      <ArticleBody>
        <Lede>
          The Kyokushin belt system is about more than collecting techniques. Each grade asks for more
          skill, more conditioning and more spirit than the one before. Below are the KKFI belts in order,
          from white belt (Mukyu) to black belt (Shodan), with the kata learned at each.
        </Lede>

        <aside className="!my-10 rounded-lg border border-white/15 p-6">
          <p className="!my-0 text-sm font-semibold text-white">Important note</p>
          <p className="!mb-0 !mt-2 text-base text-white/75">
            Promotions are earned at a grading. Every student moves through the belts in order, and your
            instructor puts you forward for each grading when you are ready. The{' '}
            <Link href="/syllabus">KKFI syllabus</Link> is the source of truth for what each grade
            covers; this guide is a summary of it.
          </p>
        </aside>
      </ArticleBody>

      {/* The ranks, in order: a swatch of the belt, its grade, then what it covers and its kata. */}
      <section aria-label="Belt ranks" className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <ol className="border-t border-white/15">
          {SYLLABUS.map((entry, i) => (
            <Reveal as="li" key={entry.belt} delay={Math.min(i, 2) * 0.05} className="grid gap-6 border-b border-white/10 py-10 md:grid-cols-[16rem_1fr] md:gap-12">
              <div>
                <span
                  aria-hidden="true"
                  className={`block h-3 w-24 rounded-sm ${entry.belt === 'Black' ? 'ring-1 ring-secondary/60' : 'ring-1 ring-white/20'}`}
                  style={{ backgroundColor: SWATCH[entry.belt] }}
                />
                <h2 className="mt-5 text-2xl font-extrabold leading-tight text-white">{entry.belt} Belt</h2>
                {RANK[entry.belt] && <p className="mt-1 text-sm font-semibold text-white/60">{RANK[entry.belt]}</p>}
              </div>
              <div className="max-w-[60ch]">
                <p className="text-pretty text-[1.0625rem] leading-[1.65] text-white/80">{entry.overview}</p>
                <h3 className="mt-7 text-sm font-semibold text-white/55">Kata</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[1.0625rem] leading-[1.65] text-white/80 marker:text-white/35">
                  {entry.kata.map((k) => (
                    <li key={k.name} className="pl-1">
                      <span className="font-semibold text-white">{k.name}</span>
                      {k.japanese && <span lang="ja" className="ml-2 text-white/55">{k.japanese}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <ArticleBody>
        <h2>Beyond Shodan: The Dan Ranks</h2>
        <p>
          In Kyokushin, a black belt is the start of serious training, not the end of it. After Shodan come
          the dan grades, each awarded at a later grading:
        </p>
        <ol>
          {DAN_NAMES.map((name, i) => (
            <li key={name}>
              <strong>{name}</strong> ({ordinal(i + 1)} Dan)
            </li>
          ))}
        </ol>
        <p>
          See the <Link href="/belt-system">belt system</Link> for more on each rank.
        </p>
      </ArticleBody>

      <ArticleCta
        title="Ready for Your Next Grading?"
        body="Gradings are announced on the KKFI calendar. Register as a member to be eligible for promotions and to keep your belt record in your profile."
        actions={[
          { href: '/register', label: 'Become a KKFI Member', primary: true },
          { href: '/syllabus', label: 'Full Training Syllabus' },
        ]}
      />

      <KeepReading
        links={[
          { href: '/blog/kyokushin-vs-shotokan', title: 'What Makes Kyokushin Different from Shotokan?', note: 'Karate Knowledge' },
          { href: '/blog/full-contact-training-youth-benefits', title: 'The Benefits of Full-Contact Training for Youth', note: 'Youth Development' },
          { href: '/blog/history-kyokushin-india', title: 'History of Kyokushin in India: From Sosai Oyama to Today', note: 'Our Heritage' },
          { href: '/events', title: 'Upcoming KKFI Tournaments & Events', note: 'Events' },
        ]}
      />
    </article>
  );
}
