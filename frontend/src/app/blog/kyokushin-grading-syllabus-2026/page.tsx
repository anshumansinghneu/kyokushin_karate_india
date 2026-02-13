import type { Metadata } from 'next';
import Link from 'next/link';

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
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-red-950/40 to-black py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-red-600/20 border border-red-600/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
            Official Syllabus
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Kyokushin <span className="text-red-500">Grading Syllabus</span> 2026
          </h1>
          <p className="text-xl text-gray-400 mb-2">Complete Belt Rank Guide & Requirements</p>
          <p className="text-gray-500 text-lg">
            Published February 13, 2026 · By Kyokushin Karate Foundation of India
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          The Kyokushin belt system is not just about learning techniques — it&apos;s about
          forging character through progressively harder challenges. Each belt grade demands more
          physical conditioning, technical skill, and mental toughness. Below is the complete
          2026 KKFI grading syllabus from white belt (Mukyu) to black belt (Shodan).
        </p>

        <div className="bg-zinc-900/50 rounded-xl p-6 border border-yellow-600/20 mb-12">
          <p className="text-yellow-400 font-bold text-sm mb-2">⚡ IMPORTANT NOTE</p>
          <p className="text-gray-300 text-sm">
            Kyokushin promotions are earned — never purchased. Every grading includes demonstrated
            kata, kumite (sparring), and conditioning. There are no &quot;fast-track&quot; belts.
            The requirements below are minimum standards; your instructor may require additional
            preparation before approving you for grading.
          </p>
        </div>

        {/* Belt Cards */}
        <div className="space-y-8">
          {beltRanks.map((belt, i) => (
            <div key={i} className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-red-600/20 transition-all">
              {/* Belt Header */}
              <div className={`flex items-center gap-4 p-6 ${i === beltRanks.length - 1 ? 'bg-gradient-to-r from-red-950/40 to-zinc-900/60' : ''}`}>
                <div className={`w-10 h-10 rounded-full ${belt.color} flex-shrink-0`} />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{belt.belt}</h2>
                  <p className="text-red-400 text-sm font-medium">{belt.rank}</p>
                </div>
                <span className="text-xs text-gray-500 font-mono">{belt.minTraining}</span>
              </div>

              <div className="px-6 pb-6">
                {/* Meta row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Kata Required</span>
                    <p className="text-white font-medium text-sm mt-1">{belt.kataRequired}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Kumite</span>
                    <p className="text-white font-medium text-sm mt-1">{belt.kumite}</p>
                  </div>
                </div>

                {/* Requirements */}
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {belt.requirements.map((req, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">●</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Beyond Black Belt */}
        <div className="mt-16 prose prose-invert prose-lg prose-red max-w-none">
          <h2 className="text-3xl font-bold text-white mb-6">Beyond Shodan: The Dan Ranks</h2>
          <p className="text-gray-300">
            Earning a black belt in Kyokushin is not the end — it is the beginning. The dan ranks
            (Shodan through Judan) represent decades of continued training, teaching, and contribution
            to the art. Promotions beyond Shodan typically require:
          </p>
          <ul className="text-gray-300">
            <li><strong>Nidan (2nd Dan):</strong> Minimum 2 years after Shodan + 30-man kumite</li>
            <li><strong>Sandan (3rd Dan):</strong> Minimum 3 years + advanced kata + tournament achievements</li>
            <li><strong>Yondan (4th Dan):</strong> &quot;Sensei&quot; title earned + 10+ years of accumulated training</li>
            <li><strong>Godan+ (5th Dan+):</strong> Recognized for lifetime contributions to Kyokushin. The legendary 100-man kumite is associated with this level.</li>
          </ul>

          <blockquote className="border-l-4 border-red-600 pl-6 my-8 italic text-gray-400">
            &quot;A black belt is a white belt who never quit.&quot;
            <br />— Common Kyokushin saying
          </blockquote>
        </div>

        {/* Grading Schedule CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-red-950/30 to-zinc-900/50 rounded-2xl border border-red-600/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Ready for Your Next Grading?</h3>
          <p className="text-gray-400 mb-6">
            KKFI conducts official belt gradings quarterly. Register as a member to be eligible
            for promotions and track your belt progression digitally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/syllabus"
              className="inline-block px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all border border-white/10"
            >
              Full Training Syllabus
            </Link>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all"
            >
              Become a KKFI Member
            </Link>
          </div>
        </div>

        {/* Internal Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Related Articles</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/blog/kyokushin-vs-shotokan" className="text-red-400 hover:text-red-300 transition-colors">
                What Makes Kyokushin Different from Shotokan? →
              </Link>
            </li>
            <li>
              <Link href="/blog/full-contact-training-youth-benefits" className="text-red-400 hover:text-red-300 transition-colors">
                The Benefits of Full-Contact Training for Youth →
              </Link>
            </li>
            <li>
              <Link href="/blog/history-kyokushin-india" className="text-red-400 hover:text-red-300 transition-colors">
                History of Kyokushin in India: From Sosai Oyama to Today →
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-red-400 hover:text-red-300 transition-colors">
                Upcoming KKFI Tournaments & Events →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}
