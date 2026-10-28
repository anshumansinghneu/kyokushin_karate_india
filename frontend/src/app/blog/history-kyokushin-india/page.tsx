import type { Metadata } from 'next';
import Reveal from '@/components/brand/Reveal';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede } from '../_components/article';

const guide = GUIDES[2];

export const metadata: Metadata = {
  title: 'History of Kyokushin Karate in India | From Sosai Oyama to KKFI',
  description: 'The complete history of Kyokushin Karate in India — from Sosai Masutatsu Oyama\'s founding of the style, to its arrival in India, to the Kyokushin Karate Foundation of India (KKFI) led by Shihan Vasant Kumar Singh.',
  keywords: [
    'Kyokushin karate history India',
    'Sosai Masutatsu Oyama',
    'IKO Kyokushin India',
    'Shihan Vasant Kumar Singh',
    'KKFI history',
    'Kyokushin karate origin',
    'full contact karate history',
    'martial arts history India',
  ],
  alternates: {
    canonical: 'https://www.kyokushinfoundation.com/blog/history-kyokushin-india',
  },
  openGraph: {
    title: 'History of Kyokushin in India: From Sosai Oyama to Today',
    description: 'The complete history of Kyokushin Karate in India — from Sosai Oyama to KKFI under Shihan Vasant Kumar Singh.',
    type: 'article',
    publishedTime: '2026-02-13T00:00:00.000Z',
    authors: ['Kyokushin Karate Foundation of India'],
    tags: ['Kyokushin History', 'India', 'Sosai Oyama', 'KKFI', 'Martial Arts History'],
  },
};

export default function HistoryKyokushinIndia() {
  // Sourced facts only (the redesign spec's authenticity ledger). India's own early history
  // and membership numbers stay out until KKFI confirms them.
  const timeline = [
    {
      year: '1957',
      title: 'The Name Kyokushin',
      description: 'Masutatsu Oyama names his karate Kyokushin, "the ultimate truth".',
    },
    {
      year: '1964',
      title: 'Sosai Oyama Founds the IKO',
      description: 'Oyama establishes the International Karate Organization Kyokushinkaikan, with its Honbu dojo in Ikebukuro, Tokyo: full-contact karate, hard training and the Osu spirit.',
    },
    {
      year: '1975',
      title: 'The First World Open',
      description: 'Kyokushin holds its First World Open Tournament: knockdown fighting, with full-contact strikes to the body and legs, kicks to the head allowed, and no hand strikes to the head or face.',
    },
    {
      year: '1994',
      title: 'Sosai Oyama Passes Away',
      description: 'The founder of Kyokushin dies in April 1994.',
    },
    {
      year: '2013',
      title: 'KKFI Is Established',
      description: 'Shihan Vasant Kumar Singh founds the Kyokushin Karate Foundation of India, with its headquarters in Shuklaganj (Unnao), Uttar Pradesh. KKFI is affiliated to World Kyokushin Kaikan, led by Daihyo Ryuko Take.',
    },
    {
      year: 'Today',
      title: 'KKFI Today',
      description: 'KKFI runs dojos in cities across India, national tournaments and belt gradings, all on one register. The live list of dojos is on Find a dojo.',
    },
  ];

  return (
    <article className="min-h-screen text-white">
      <ArticleHero
        kanji="歴史"
        category={guide.category}
        title="History of Kyokushin in India"
        subtitle="From Sosai Oyama to Today"
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
          Kyokushin began with one man&apos;s training in the mountains of Japan and became a full-contact
          karate practised around the world. In India it is taught by the Kyokushin Karate Foundation of
          India, founded in 2013 and part of World Kyokushin Kaikan.
        </Lede>

        <h2>Who Was Sosai Masutatsu Oyama?</h2>
        <p>
          Born Choi Yeong-eui in Korea in 1923, Masutatsu Oyama moved to Japan and trained in multiple
          martial arts before retreating to <strong>Mount Minobu</strong> for solitary training. The
          stories of his fights with bulls come from his own account and have become legend. In 1964, he
          established the International Karate Organization (IKO) and
          named his style <strong>&quot;Kyokushin&quot;</strong> — meaning &quot;the ultimate truth.&quot;
          His philosophy was simple: <em>&quot;The heart of our karate is real fighting. There can be no
          proof without real fighting. Without proof, there is no trust. Without trust, there is no
          respect.&quot;</em>
        </p>
      </ArticleBody>

      {/* Timeline: a real sequence, so an ordered list with the years carrying it. */}
      <section aria-label="Timeline" className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <ol className="border-t border-white/15">
          {timeline.map((event, i) => (
            <Reveal as="li" key={event.year} delay={Math.min(i, 3) * 0.05} className="grid gap-2 border-b border-white/10 py-9 md:grid-cols-[11rem_1fr] md:gap-10">
              <span className="text-[clamp(2rem,4vw,3rem)] font-black leading-none tracking-[-0.03em] text-white/35 tabular-nums">{event.year}</span>
              <div className="max-w-[60ch]">
                <h3 className="text-xl font-bold leading-snug text-white md:text-2xl">{event.title}</h3>
                <p className="mt-3 text-pretty text-[1.0625rem] leading-[1.75] text-white/75">{event.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <ArticleBody>
        <h2>Shihan Vasant Kumar Singh &amp; KKFI&apos;s Mission</h2>
        <p>
          Under the leadership of <strong>Shihan Vasant Kumar Singh</strong>, the Kyokushin Karate Foundation
          of India carries forward Sosai Oyama&apos;s vision with a distinctly Indian mission: to make
          authentic Kyokushin training available to practitioners across the country.
        </p>
        <p>
          In practice that means one syllabus and one standard of grading in every KKFI dojo, national
          tournaments, and a single register of members, instructors and results that anyone can verify.
        </p>
      </ArticleBody>

      <ArticleCta
        title="Be Part of the Legacy"
        body="Train in Sosai Oyama's karate under KKFI instructors, with gradings recorded on one register."
        actions={[
          { href: '/register', label: 'Register Now', primary: true },
          { href: '/intro', label: 'About KKFI' },
        ]}
      />

      <KeepReading
        links={[
          { href: '/blog/kyokushin-vs-shotokan', title: 'What Makes Kyokushin Different from Shotokan?', note: 'Karate Knowledge' },
          { href: '/blog/full-contact-training-youth-benefits', title: 'The Benefits of Full-Contact Training for Youth', note: 'Youth Development' },
          { href: '/blog/kyokushin-grading-syllabus-2026', title: 'Kyokushin Grading Syllabus 2026: Belt Guide', note: 'KKFI Syllabus' },
          { href: '/instructors', title: 'Meet Our Certified Instructors', note: 'Instructors' },
        ]}
      />
    </article>
  );
}
