import type { Metadata } from 'next';
import Reveal from '@/components/brand/Reveal';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede, PullQuote } from '../_components/article';

const guide = GUIDES[3];

/** Belt cloth colours for the swatches; black is lifted off pure black so it reads. */
const SWATCH: Record<string, string> = {
  'White Belt': '#f5f5f5',
  'Orange Belt': '#f97316',
  'Blue Belt': '#2563eb',
  'Yellow Belt': '#facc15',
  'Green Belt': '#16a34a',
  'Brown Belt': '#92400e',
  'Black Belt': '#161616',
};

export const metadata: Metadata = {
  title: 'Kyokushin Grading Syllabus 2026 | Complete Belt Rank Guide & Requirements',
  description: 'Complete 2026 Kyokushin Karate grading syllabus — belt colors, kata requirements, kumite expectations & promotion criteria. Official guide by the Kyokushin Karate Foundation of India (KKFI).',
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
    title: 'Kyokushin Grading Syllabus 2026: Complete Belt Guide',
    description: 'Complete 2026 Kyokushin belt grading syllabus — from white belt to black belt. Kata, kumite & conditioning requirements.',
    type: 'article',
    publishedTime: '2026-02-13T00:00:00.000Z',
    authors: ['Kyokushin Karate Foundation of India'],
    tags: ['Grading', 'Syllabus', 'Belt Ranks', 'Kyokushin', 'Karate'],
  },
};

export default function GradingSyllabus2026() {
  const beltRanks = [
    {
      belt: 'White Belt',
      rank: 'Mukyu',
      color: 'bg-white',
      textColor: 'text-black',
      kataRequired: 'Taikyoku Sono Ichi',
      kumite: 'Not required',
      minTraining: 'Starting point',
      requirements: [
        'Basic stances: Zenkutsu-dachi, Kokutsu-dachi, Kiba-dachi',
        'Basic punches: Seiken (fore-fist), Oi-tsuki, Gyaku-tsuki',
        'Basic kicks: Mae-geri (front kick), Mawashi-geri (roundhouse)',
        'Basic blocks: Jodan-uke, Chudan Soto-uke, Gedan-barai',
        'Dojo etiquette and terminology',
      ],
    },
    {
      belt: 'Orange Belt',
      rank: '10th–9th Kyu',
      color: 'bg-orange-500',
      textColor: 'text-white',
      kataRequired: 'Taikyoku Sono Ni & Sono San',
      kumite: '3 rounds light sparring',
      minTraining: '3–4 months',
      requirements: [
        'All white belt techniques with improved form',
        'Yoko-geri (side kick), Ushiro-geri (back kick) basics',
        'Combination attacks: punch-kick, kick-punch',
        'Moving basics (ido geiko) forwards and backwards',
        'Understanding of "Osu" spirit and training discipline',
      ],
    },
    {
      belt: 'Blue Belt',
      rank: '8th–7th Kyu',
      color: 'bg-blue-600',
      textColor: 'text-white',
      kataRequired: 'Pinan Sono Ichi & Ni',
      kumite: '5 rounds contact sparring',
      minTraining: '6–8 months',
      requirements: [
        'Hiza-geri (knee kick), Kansetsu-geri (joint kick)',
        'Advanced blocking combinations',
        'Sparring fundamentals: distance control, timing',
        'Increased conditioning requirements (50 push-ups, 50 sit-ups)',
        'Introduction to body conditioning (Kotai)',
      ],
    },
    {
      belt: 'Yellow Belt',
      rank: '6th–5th Kyu',
      color: 'bg-yellow-400',
      textColor: 'text-black',
      kataRequired: 'Pinan Sono San, Yon, Go',
      kumite: '7 rounds full-contact sparring',
      minTraining: '12–18 months',
      requirements: [
        'All basic techniques at high speed and power',
        'Ura Mawashi-geri (hook kick), Ushiro Mawashi-geri (spinning hook kick)',
        'Advanced combinations in sparring',
        'Conditioning: 100 push-ups, 100 sit-ups, 100 squats',
        'Demonstrable fighting ability in kumite',
      ],
    },
    {
      belt: 'Green Belt',
      rank: '4th–3rd Kyu',
      color: 'bg-green-600',
      textColor: 'text-white',
      kataRequired: 'Sanchin, Gekisai Dai',
      kumite: '10 rounds full-contact sparring',
      minTraining: '2–3 years',
      requirements: [
        'Sanchin breathing technique mastery',
        'Advanced kata with practical bunkai (application)',
        'Tournament-level sparring ability',
        'Ability to demonstrate and explain techniques',
        'Beginning of teaching responsibilities in dojo',
      ],
    },
    {
      belt: 'Brown Belt',
      rank: '2nd–1st Kyu',
      color: 'bg-amber-800',
      textColor: 'text-white',
      kataRequired: 'Tsuki no Kata, Yantsu, Gekisai Sho',
      kumite: '15–20 rounds full-contact sparring',
      minTraining: '3–5 years',
      requirements: [
        'Complete mastery of all kyu-level techniques',
        'Advanced kumite strategy and ring generalship',
        'Teaching junior students effectively',
        'Deep understanding of Kyokushin philosophy',
        'Preparation for Shodan (1st Dan) examination',
      ],
    },
    {
      belt: 'Black Belt',
      rank: 'Shodan (1st Dan)',
      color: 'bg-black border-2 border-white/30',
      textColor: 'text-white',
      kataRequired: 'Kanku Dai, all previous kata',
      kumite: '30+ rounds (including 20-man kumite)',
      minTraining: '4–6 years minimum',
      requirements: [
        'Perfect execution of all kata with proper breathing and spirit',
        'Survive the 20-man kumite: fighting 20 opponents consecutively',
        'Written examination on Kyokushin history and philosophy',
        'Demonstrated teaching ability and leadership',
        'Recommendation from certified senior instructor',
        'This is the beginning — not the end — of the journey',
      ],
    },
  ];

  return (
    <article className="min-h-screen bg-black text-white">
      <ArticleHero
        category={guide.category}
        title="Kyokushin Grading Syllabus 2026"
        subtitle="Complete Belt Rank Guide & Requirements"
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
          The Kyokushin belt system is not just about learning techniques — it&apos;s about
          forging character through progressively harder challenges. Each belt grade demands more
          physical conditioning, technical skill, and mental toughness. Below is the complete
          2026 KKFI grading syllabus from white belt (Mukyu) to black belt (Shodan).
        </Lede>

        <aside className="!my-10 rounded-lg border border-white/15 p-6">
          <p className="!my-0 text-sm font-semibold text-white">Important note</p>
          <p className="!mb-0 !mt-2 text-base text-white/75">
            Kyokushin promotions are earned — never purchased. Every grading includes demonstrated
            kata, kumite (sparring), and conditioning. There are no &quot;fast-track&quot; belts.
            The requirements below are minimum standards; your instructor may require additional
            preparation before approving you for grading.
          </p>
        </aside>
      </ArticleBody>

      {/* The ranks, in order: a swatch of the belt, the essentials, then the full list. */}
      <section aria-label="Belt requirements" className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <ol className="border-t border-white/15">
          {beltRanks.map((belt, i) => (
            <Reveal as="li" key={belt.belt} delay={Math.min(i, 2) * 0.05} className="grid gap-6 border-b border-white/10 py-10 md:grid-cols-[16rem_1fr] md:gap-12">
              <div>
                <span
                  aria-hidden="true"
                  className={`block h-3 w-24 rounded-sm ${belt.belt === 'Black Belt' ? 'ring-1 ring-secondary/60' : 'ring-1 ring-white/20'}`}
                  style={{ backgroundColor: SWATCH[belt.belt] }}
                />
                <h2 className="mt-5 text-2xl font-extrabold leading-tight text-white">{belt.belt}</h2>
                <p className="mt-1 text-sm font-semibold text-white/60">{belt.rank}</p>
                <p className="mt-4 text-sm text-white/55">Minimum training</p>
                <p className="font-semibold text-white">{belt.minTraining}</p>
              </div>
              <div className="max-w-[60ch]">
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-white/55">Kata required</dt>
                    <dd className="mt-1 font-semibold text-white">{belt.kataRequired}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/55">Kumite</dt>
                    <dd className="mt-1 font-semibold text-white">{belt.kumite}</dd>
                  </div>
                </dl>
                <h3 className="mt-7 text-sm font-semibold text-white/55">Requirements</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[1.0625rem] leading-[1.65] text-white/80 marker:text-white/35">
                  {belt.requirements.map((req) => (
                    <li key={req} className="pl-1">{req}</li>
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
          Earning a black belt in Kyokushin is not the end — it is the beginning. The dan ranks
          (Shodan through Judan) represent decades of continued training, teaching, and contribution
          to the art. Promotions beyond Shodan typically require:
        </p>
        <ul>
          <li><strong>Nidan (2nd Dan):</strong> Minimum 2 years after Shodan + 30-man kumite</li>
          <li><strong>Sandan (3rd Dan):</strong> Minimum 3 years + advanced kata + tournament achievements</li>
          <li><strong>Yondan (4th Dan):</strong> &quot;Sensei&quot; title earned + 10+ years of accumulated training</li>
          <li><strong>Godan+ (5th Dan+):</strong> Recognized for lifetime contributions to Kyokushin. The legendary 100-man kumite is associated with this level.</li>
        </ul>

        <PullQuote cite="Common Kyokushin saying">&quot;A black belt is a white belt who never quit.&quot;</PullQuote>
      </ArticleBody>

      <ArticleCta
        title="Ready for Your Next Grading?"
        body="KKFI conducts official belt gradings quarterly. Register as a member to be eligible for promotions and track your belt progression digitally."
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
