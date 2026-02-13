import type { Metadata } from 'next';
import Link from 'next/link';

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
      year: '2020s',
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
    <article className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-red-950/40 to-black py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-red-600/20 border border-red-600/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
            Our Heritage
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            History of <span className="text-red-500">Kyokushin</span> in India
          </h1>
          <p className="text-xl text-gray-400 mb-2">From Sosai Oyama to Today</p>
          <p className="text-gray-500 text-lg">
            Published February 13, 2026 · By Kyokushin Karate Foundation of India
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          The story of Kyokushin Karate in India is a story of warrior spirit traveling across borders.
          From the mountains of Japan where one man forged the &quot;ultimate truth&quot; style through
          superhuman training, to the dojos of Uttar Pradesh, Maharashtra, and beyond — Kyokushin&apos;s
          journey to India is one of perseverance, authenticity, and an unbreakable commitment to
          full-contact martial arts.
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Who Was Sosai Masutatsu Oyama?</h2>
        <p className="text-gray-300 leading-relaxed mb-12">
          Born Choi Yeong-eui in Korea in 1923, Masutatsu Oyama moved to Japan and trained in multiple
          martial arts before retreating to <strong>Mount Minobu</strong> for 18 months of solitary training.
          He meditated under waterfalls, broke stones with his hands, and fought bulls — killing three
          with single strikes. In 1964, he established the International Karate Organization (IKO) and
          named his style <strong>&quot;Kyokushin&quot;</strong> — meaning &quot;the ultimate truth.&quot;
          His philosophy was simple: <em>&quot;The heart of our karate is real fighting. There can be no
          proof without real fighting. Without proof, there is no trust. Without trust, there is no
          respect.&quot;</em>
        </p>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-red-600/50 to-transparent" />

          <div className="space-y-12">
            {timeline.map((event, i) => (
              <div key={i} className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 top-1 w-5 h-5 rounded-full bg-red-600 border-4 border-black" />
                <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/10">
                  <span className="text-red-500 font-black text-sm tracking-widest">{event.year}</span>
                  <h3 className="text-xl font-bold text-white mt-1 mb-3">{event.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shihan Section */}
        <div className="mt-16 prose prose-invert prose-lg prose-red max-w-none">
          <h2 className="text-3xl font-bold text-white mt-12 mb-6">Shihan Vasant Kumar Singh & KKFI&apos;s Mission</h2>
          <p className="text-gray-300">
            Under the leadership of <strong>Shihan Vasant Kumar Singh</strong>, the Kyokushin Karate Foundation
            of India carries forward Sosai Oyama&apos;s vision with a distinctly Indian mission: to make
            world-class, authentic Kyokushin training accessible to practitioners across the country —
            regardless of economic background.
          </p>
          <p className="text-gray-300">
            KKFI&apos;s key initiatives include:
          </p>
          <ul className="text-gray-300 space-y-2">
            <li><strong>Standardized grading and certification</strong> aligned with international Kyokushin standards</li>
            <li><strong>National tournaments</strong> providing Indian fighters a platform to compete at the highest level</li>
            <li><strong>CSR programs</strong> offering free or subsidized training to underprivileged youth</li>
            <li><strong>Instructor development</strong> ensuring every KKFI dojo maintains the highest teaching standards</li>
            <li><strong>Digital infrastructure</strong> for membership management, belt tracking, and tournament organization</li>
          </ul>

          <blockquote className="border-l-4 border-red-600 pl-6 my-8 italic text-gray-400">
            &quot;Kyokushin is not just a fighting style. It is a way of life. Our mission is to bring this
            path of strength and character to every corner of India.&quot;
            <br />— Shihan Vasant Kumar Singh, KKFI
          </blockquote>
        </div>

        <div className="mt-12 p-8 bg-gradient-to-r from-red-950/30 to-zinc-900/50 rounded-2xl border border-red-600/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Be Part of the Legacy</h3>
          <p className="text-gray-400 mb-6">
            Join thousands of practitioners continuing Sosai Oyama&apos;s legacy in India.
            Train under certified KKFI instructors and earn internationally recognized belt grades.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/intro"
              className="inline-block px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all border border-white/10"
            >
              About KKFI
            </Link>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all"
            >
              Register Now
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
              <Link href="/blog/kyokushin-grading-syllabus-2026" className="text-red-400 hover:text-red-300 transition-colors">
                Kyokushin Grading Syllabus 2026: Complete Belt Guide →
              </Link>
            </li>
            <li>
              <Link href="/instructors" className="text-red-400 hover:text-red-300 transition-colors">
                Meet Our Certified Instructors →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}
