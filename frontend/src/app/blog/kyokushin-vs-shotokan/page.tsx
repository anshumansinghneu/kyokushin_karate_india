import type { Metadata } from 'next';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede, PullQuote } from '../_components/article';

export const metadata: Metadata = {
  title: 'What Makes Kyokushin Different from Shotokan? | Full Contact vs Traditional Karate',
  description: 'Discover the key differences between Kyokushin and Shotokan karate. Learn why Kyokushin\'s full-contact sparring, conditioning drills, and fighting spirit set it apart from other karate styles. Expert comparison by KKFI.',
  keywords: [
    'Kyokushin vs Shotokan',
    'full-contact karate vs traditional karate',
    'Kyokushin karate difference',
    'best karate style India',
    'Kyokushin karate benefits',
    'full contact karate India',
    'karate styles comparison',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/blog/kyokushin-vs-shotokan',
  },
  openGraph: {
    title: 'What Makes Kyokushin Different from Shotokan?',
    description: 'Discover the key differences between Kyokushin and Shotokan karate — full-contact sparring, conditioning, and the spirit of Osu!',
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
          you&apos;ve probably come across two dominant names: <strong>Kyokushin</strong> and <strong>Shotokan</strong>.
          Both are legitimate, respected styles of karate — but they are fundamentally different in philosophy,
          training, and combat application. Here&apos;s an honest, expert breakdown.
        </Lede>

        <h2>1. Contact: The Biggest Difference</h2>
        <p>
          <strong>Shotokan</strong> is a &quot;non-contact&quot; or &quot;light-contact&quot; style. In tournaments,
          fighters score points by executing techniques that stop just before impact. Judges watch for clean form,
          correct distancing, and speed. A punch that actually lands hard is typically penalized.
        </p>
        <p>
          <strong>Kyokushin</strong>, founded by <strong>Sosai Masutatsu Oyama</strong>, is the original
          full-contact karate. Fighters strike with full power. Kicks to the body, legs, and head are delivered
          at 100% force. There are no points — a fight is won by knockout, decision, or the opponent&apos;s inability
          to continue. This is why Kyokushin practitioners call their art &quot;the strongest karate.&quot;
        </p>

        <h2>2. Kata and Form</h2>
        <p>
          Both styles practice kata (pre-arranged patterns of techniques), but the emphasis differs.
          Shotokan kata tend to favor long, deep stances and aesthetic precision. Kyokushin kata —
          while still technically demanding — are practiced with a focus on practical application.
          Moves in Kyokushin kata translate directly into fighting techniques used in kumite (sparring).
        </p>

        <h2>3. Physical Conditioning</h2>
        <p>Kyokushin training is renowned for its grueling physical conditioning. A typical class includes:</p>
        <ul>
          <li><strong>100+ push-ups, sit-ups, and squats</strong> as warm-up</li>
          <li><strong>Shin conditioning</strong> by kicking heavy bags and pads</li>
          <li><strong>Body hardening drills</strong> to absorb full-contact strikes</li>
          <li><strong>The 100-man kumite</strong> — fighting 100 opponents in succession (the ultimate test)</li>
        </ul>
        <p>
          Shotokan training, while athletic, places more emphasis on speed, timing, and technical accuracy
          rather than raw physical toughness.
        </p>

        <h2>4. Tournament Rules</h2>
        {/* Side by side on wide screens: the comparison is the point. */}
        <div className="!my-10 grid gap-x-10 gap-y-8 border-y border-white/15 py-8 md:grid-cols-2">
          <div>
            <h3 className="!mt-0">Kyokushin rules</h3>
            <ul className="!my-0 !space-y-2 text-base">
              <li>Full-contact body &amp; leg strikes</li>
              <li>No punches to the face (kicks allowed)</li>
              <li>Won by knockout, ippon, or decision</li>
              <li>No protective gear (except groin guard)</li>
              <li>Emphasis on fighting spirit &amp; endurance</li>
            </ul>
          </div>
          <div>
            <h3 className="!mt-0 !text-white/70">Shotokan (WKF) rules</h3>
            <ul className="!my-0 !space-y-2 text-base text-white/70">
              <li>Controlled/no-contact strikes</li>
              <li>Punches &amp; kicks to head and body</li>
              <li>Won by points (ippon, waza-ari)</li>
              <li>Full protective gear required</li>
              <li>Emphasis on speed &amp; technique</li>
            </ul>
          </div>
        </div>

        <h2>5. Philosophy &amp; Spirit</h2>
        <p>
          Both styles teach discipline, respect, and character development. But Kyokushin adds an extra
          dimension: <strong>perseverance under pressure</strong>. The motto is &quot;Osu!&quot; — a word that
          encapsulates patience, determination, and the willingness to push beyond your limits. Training is
          intentionally difficult because the goal is not just to learn techniques, but to forge an unbreakable spirit.
        </p>
        <PullQuote cite="Sosai Masutatsu Oyama">
          &quot;One becomes a beginner after one thousand days of training and an expert after ten thousand days of practice.&quot;
        </PullQuote>

        <h2>Which Style Is Right for You?</h2>
        <p>
          If you want precise, athletic martial arts with Olympic aspirations, Shotokan through WKF is a great path.
          If you want <strong>real fighting ability, extreme conditioning, and a warrior&apos;s mindset</strong>,
          Kyokushin is unmatched. For self-defense and practical combat readiness, full-contact training
          gives you something that point-sparring simply cannot — the ability to take and deliver real strikes under pressure.
        </p>
      </ArticleBody>

      <ArticleCta
        title="Ready to Train Full-Contact?"
        body="Join the Kyokushin Karate Foundation of India and experience authentic full-contact karate training under certified instructors. Dojos across India for kids and adults."
        actions={[{ href: '/register', label: 'Register Now — ₹295 Only', primary: true }]}
      />

      {/* Internal links for SEO */}
      <KeepReading
        links={[
          { href: '/blog/full-contact-training-youth-benefits', title: 'The Benefits of Full-Contact Training for Youth', note: 'Youth Development' },
          { href: '/blog/history-kyokushin-india', title: 'History of Kyokushin in India: From Sosai Oyama to Today', note: 'Our Heritage' },
          { href: '/blog/kyokushin-grading-syllabus-2026', title: 'Kyokushin Grading Syllabus 2026: Complete Belt Guide', note: 'Official Syllabus' },
          { href: '/syllabus', title: 'View the Full KKFI Training Syllabus', note: 'Syllabus' },
        ]}
      />
    </article>
  );
}
