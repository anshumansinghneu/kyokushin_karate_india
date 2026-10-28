import type { Metadata } from 'next';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede, PullQuote } from '../_components/article';

export const metadata: Metadata = {
  title: 'What Makes Kyokushin Different from Shotokan? | Full Contact vs Traditional Karate',
  description: 'The main differences between Kyokushin and Shotokan karate: full-contact knockdown sparring versus point sparring, kata, conditioning and tournament rules. A plain comparison by KKFI.',
  keywords: [
    'Kyokushin vs Shotokan',
    'full-contact karate vs traditional karate',
    'Kyokushin karate difference',
    'karate styles India',
    'Kyokushin karate benefits',
    'full contact karate India',
    'karate styles comparison',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/blog/kyokushin-vs-shotokan',
  },
  openGraph: {
    title: 'What Makes Kyokushin Different from Shotokan?',
    description: 'The key differences between Kyokushin and Shotokan karate: full-contact sparring, conditioning, and the spirit of Osu!',
    type: 'article',
    publishedTime: '2026-02-13T00:00:00.000Z',
    authors: ['Kyokushin Karate Foundation of India'],
    tags: ['Kyokushin', 'Shotokan', 'Karate', 'Martial Arts', 'Full Contact'],
  },
};

const guide = GUIDES[0];

export default function KyokushinVsShotokan() {
  return (
    <article className="min-h-screen text-white">
      <ArticleHero
        kanji="組手"
        category={guide.category}
        title="What Makes Kyokushin Different from Shotokan?"
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
          If you&apos;ve ever searched for &quot;karate classes near me&quot; or &quot;best karate style for self-defense,&quot;
          you&apos;ve probably come across two names: <strong>Kyokushin</strong> and <strong>Shotokan</strong>.
          Both are respected styles of karate, but they differ in how they spar, how they compete and what
          their training puts first. Here is a plain comparison.
        </Lede>

        <h2>1. Contact: The Biggest Difference</h2>
        <p>
          <strong>Shotokan</strong> competition is usually point sparring. Fighters score by landing clean,
          controlled techniques, and judges look for good form, correct distance and speed. Excessive contact
          is penalised.
        </p>
        <p>
          <strong>Kyokushin</strong>, founded by <strong>Sosai Masutatsu Oyama</strong>, is a full-contact style.
          Under its knockdown rules, fighters strike the body and legs with full power and may kick to the head,
          but hand strikes to the head or face are not allowed. Bouts are not scored on touches: a fight is won
          by knockdown or on the referees&apos; decision. It is often called &quot;the strongest karate.&quot;
        </p>

        <h2>2. Kata and Form</h2>
        <p>
          Both styles practise kata (set patterns of techniques). Shotokan is known for long, deep stances
          and precise form. Kyokushin&apos;s kata, from the Taikyoku and Pinan series to Kanku Dai, are
          practised alongside kihon (basics) and kumite (sparring), with attention to how their techniques
          work against a resisting partner.
        </p>

        <h2>3. Physical Conditioning</h2>
        <p>
          Because Kyokushin fighters take real strikes, its training has a reputation for hard conditioning.
          Classes commonly include:
        </p>
        <ul>
          <li><strong>Conditioning exercises</strong> such as push-ups, sit-ups and squats</li>
          <li><strong>Kicking heavy bags and pads</strong> to build power and toughen the shins</li>
          <li><strong>Body conditioning drills</strong> to get used to taking full-contact strikes</li>
        </ul>
        <p>
          The <strong>100-man kumite</strong>, fighting one hundred opponents one after another, is not part
          of normal training. It is Sosai Oyama&apos;s legendary test; the first person to complete it after
          him was Steve Arneil, in 1965.
        </p>
        <p>
          Shotokan training is athletic too, with more of its emphasis on speed, timing and technical accuracy.
        </p>

        <h2>4. Tournament Rules</h2>
        {/* Side by side on wide screens: the comparison is the point. */}
        <div className="!my-10 grid gap-x-10 gap-y-8 border-y border-white/15 py-8 md:grid-cols-2">
          <div>
            <h3 className="!mt-0">Kyokushin (knockdown) rules</h3>
            <ul className="!my-0 !space-y-2 text-base">
              <li>Full-contact strikes to the body &amp; legs</li>
              <li>Kicks to the head allowed</li>
              <li>No hand strikes to the head or face</li>
              <li>Won by knockdown or decision</li>
            </ul>
          </div>
          <div>
            <h3 className="!mt-0 !text-white/70">Shotokan (WKF points) rules</h3>
            <ul className="!my-0 !space-y-2 text-base text-white/70">
              <li>Controlled strikes; excessive contact penalised</li>
              <li>Punches &amp; kicks to head and body score</li>
              <li>Won on points</li>
              <li>Protective gear worn</li>
            </ul>
          </div>
        </div>

        <h2>5. Philosophy &amp; Spirit</h2>
        <p>
          Both styles teach discipline, respect and character. Kyokushin puts particular weight on
          <strong> perseverance under pressure</strong>. &quot;Osu!&quot;, heard constantly in the dojo, stands
          for patience, determination and the willingness to push past your limits. Training is meant to be
          hard, because the aim is to build spirit as well as technique.
        </p>
        <PullQuote cite="Miyamoto Musashi, as quoted by Sosai Oyama">
          &quot;One thousand days to forge, ten thousand to polish.&quot;
        </PullQuote>

        <h2>Which Style Is Right for You?</h2>
        <p>
          If you want precise, fast, technical karate and a route into points competition, Shotokan is a
          good path. If you want to spar with real contact and train hard conditioning, Kyokushin will suit
          you. For self-defence, full-contact training gives you practice at taking and delivering real strikes
          under pressure, which point sparring is not designed to do. The best way to decide is to watch a
          class of each.
        </p>
      </ArticleBody>

      <ArticleCta
        title="Ready to Train Full-Contact?"
        body="Join the Kyokushin Karate Foundation of India and train full-contact karate at a KKFI dojo. Classes for children and adults."
        actions={[{ href: '/register', label: 'Register Now', primary: true }]}
      />

      {/* Internal links for SEO */}
      <KeepReading
        links={[
          { href: '/blog/full-contact-training-youth-benefits', title: 'The Benefits of Full-Contact Training for Youth', note: 'Youth Development' },
          { href: '/blog/history-kyokushin-india', title: 'History of Kyokushin in India: From Sosai Oyama to Today', note: 'Our Heritage' },
          { href: '/blog/kyokushin-grading-syllabus-2026', title: 'Kyokushin Grading Syllabus 2026: Belt Guide', note: 'KKFI Syllabus' },
          { href: '/syllabus', title: 'View the Full KKFI Training Syllabus', note: 'Syllabus' },
        ]}
      />
    </article>
  );
}
