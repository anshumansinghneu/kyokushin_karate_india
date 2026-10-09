import type { Metadata } from 'next';
import Reveal from '@/components/brand/Reveal';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede, PullQuote } from '../_components/article';

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
    canonical: 'https://kyokushinfoundation.com/blog/history-kyokushin-india',
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
  const timeline = [
    {
      year: '1964',
      title: 'Sosai Oyama Founds the IKO',
      description: 'After years of isolated mountain training and defeating bulls with his bare hands, Masutatsu Oyama establishes the International Karate Organization (IKO) in Tokyo, Japan. He codifies Kyokushin — "the ultimate truth" — as the world\'s first organized full-contact karate style.',
    },
    {
      year: '1970s',
      title: 'The First World Tournaments',
      description: 'Kyokushin holds its First World Open Tournament in 1975. Fighters from across the globe compete in bare-knuckle, full-contact bouts. The world takes notice of this brutal, honest fighting art. Kyokushin grows to 12 million practitioners globally.',
    },
    {
      year: '1980s',
      title: 'Kyokushin Reaches India',
      description: 'Japanese instructors and Indian martial artists who trained in Japan bring Kyokushin to Indian shores. The first dojos open in metropolitan cities. India\'s martial arts community, previously dominated by Shotokan and Goju-Ryu, encounters the power of full-contact for the first time.',
    },
    {
      year: '1994',
      title: 'Sosai Oyama Passes Away',
      description: 'The founder of Kyokushin dies in April 1994, leaving behind a martial art practiced by millions. His passing leads to organizational splits, but the spirit of Kyokushin — Osu! — remains unbreakable worldwide.',
    },
    {
      year: '2000s',
      title: 'Growth Across India',
      description: 'Multiple Kyokushin organizations establish roots in India. Dojos open in Uttar Pradesh, Maharashtra, Delhi, West Bengal, and southern states. Indian fighters begin competing in Asian and World Kyokushin tournaments, earning respect on the international stage.',
    },
    {
      year: '2013',
      title: 'KKFI Is Established',
      description: 'The Kyokushin Karate Foundation of India (KKFI) is founded under the leadership of Shihan Vasant Kumar Singh to unify and elevate Kyokushin training across India. KKFI focuses on standardized grading, certified instructors, youth development, and making world-class full-contact karate accessible to every Indian.',
    },
    {
      year: '2026',
      title: 'KKFI Today',
      description: 'KKFI operates dojos across multiple cities with hundreds of registered students. The foundation hosts national tournaments, conducts belt gradings aligned with international Kyokushin standards, and runs CSR programs to make martial arts accessible to underprivileged youth.',
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
          The story of Kyokushin Karate in India is a story of warrior spirit traveling across borders.
          From the mountains of Japan where one man forged the &quot;ultimate truth&quot; style through
          superhuman training, to the dojos of Uttar Pradesh, Maharashtra, and beyond — Kyokushin&apos;s
          journey to India is one of perseverance, authenticity, and an unbreakable commitment to
          full-contact martial arts.
        </Lede>

        <h2>Who Was Sosai Masutatsu Oyama?</h2>
        <p>
          Born Choi Yeong-eui in Korea in 1923, Masutatsu Oyama moved to Japan and trained in multiple
          martial arts before retreating to <strong>Mount Minobu</strong> for 18 months of solitary training.
          He meditated under waterfalls, broke stones with his hands, and fought bulls — killing three
          with single strikes. In 1964, he established the International Karate Organization (IKO) and
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
          world-class, authentic Kyokushin training accessible to practitioners across the country —
          regardless of economic background.
        </p>
        <p>KKFI&apos;s key initiatives include:</p>
        <ul>
          <li><strong>Standardized grading and certification</strong> aligned with international Kyokushin standards</li>
          <li><strong>National tournaments</strong> providing Indian fighters a platform to compete at the highest level</li>
          <li><strong>CSR programs</strong> offering free or subsidized training to underprivileged youth</li>
          <li><strong>Instructor development</strong> ensuring every KKFI dojo maintains the highest teaching standards</li>
          <li><strong>Digital infrastructure</strong> for membership management, belt tracking, and tournament organization</li>
        </ul>

        <PullQuote cite="Shihan Vasant Kumar Singh, KKFI">
          &quot;Kyokushin is not just a fighting style. It is a way of life. Our mission is to bring this
          path of strength and character to every corner of India.&quot;
        </PullQuote>
      </ArticleBody>

      <ArticleCta
        title="Be Part of the Legacy"
        body="Join thousands of practitioners continuing Sosai Oyama's legacy in India. Train under certified KKFI instructors and earn internationally recognized belt grades."
        actions={[
          { href: '/register', label: 'Register Now', primary: true },
          { href: '/intro', label: 'About KKFI' },
        ]}
      />

      <KeepReading
        links={[
          { href: '/blog/kyokushin-vs-shotokan', title: 'What Makes Kyokushin Different from Shotokan?', note: 'Karate Knowledge' },
          { href: '/blog/full-contact-training-youth-benefits', title: 'The Benefits of Full-Contact Training for Youth', note: 'Youth Development' },
          { href: '/blog/kyokushin-grading-syllabus-2026', title: 'Kyokushin Grading Syllabus 2026: Complete Belt Guide', note: 'Official Syllabus' },
          { href: '/instructors', title: 'Meet Our Certified Instructors', note: 'Instructors' },
        ]}
      />
    </article>
  );
}
