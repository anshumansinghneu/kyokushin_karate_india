import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Benefits of Full-Contact Karate Training for Youth | Martial Arts for Kids',
  description: 'Discover why full-contact Kyokushin karate is the best martial art for children and teens. Build confidence, discipline, anti-bullying resilience & physical fitness. Expert insights by KKFI.',
  keywords: [
    'martial arts for kids near me',
    'karate for children India',
    'full contact karate youth benefits',
    'self-defense classes for kids',
    'best martial arts for children',
    'Kyokushin karate kids',
    'karate anti-bullying',
    'kids karate classes India',
  ],
  alternates: {
    canonical: 'https://kyokushinfoundation.com/blog/full-contact-training-youth-benefits',
  },
  openGraph: {
    title: 'The Benefits of Full-Contact Karate Training for Youth',
    description: 'Why Kyokushin full-contact karate is the best martial art for kids — confidence, discipline, fitness & anti-bullying resilience.',
    type: 'article',
    publishedTime: '2026-02-13T00:00:00.000Z',
    authors: ['Kyokushin Karate Foundation of India'],
    tags: ['Youth Karate', 'Kids Martial Arts', 'Full Contact', 'Child Development', 'Fitness'],
  },
};

export default function YouthBenefits() {
  const benefits = [
    {
      title: 'Unshakeable Confidence',
      description: 'When a child knows they can handle real physical challenges, their confidence is not theoretical — it\'s earned. Full-contact training teaches kids that they can take a hit, get back up, and keep going. This transfers directly to academic pressure, social situations, and life challenges.',
      icon: '🛡️',
    },
    {
      title: 'Real Anti-Bullying Skills',
      description: 'Point-sparring teaches children to stop short. Full-contact training gives them genuine self-defense ability — the knowledge of what real strikes feel like and how to respond. More importantly, the confidence from training means most kids never need to use it. Bullies target those who seem vulnerable.',
      icon: '💪',
    },
    {
      title: 'Extreme Physical Fitness',
      description: 'A single Kyokushin class burns more calories than an hour of running. Kids develop cardiovascular endurance, flexibility, core strength, and coordination. In an age of screens and sedentary lifestyles, this is invaluable.',
      icon: '🏃',
    },
    {
      title: 'Discipline & Focus',
      description: 'The dojo is a structured environment with clear rules: bow when entering, address instructors with "Osu!", no talking out of turn. This discipline — practiced 3-4 times a week — rewires a child\'s approach to schoolwork, chores, and responsibilities.',
      icon: '🎯',
    },
    {
      title: 'Emotional Regulation',
      description: 'Full-contact sparring is controlled chaos. Children learn to manage fear, frustration, and adrenaline in real-time. They learn that anger makes you sloppy, panic makes you freeze, and calm focus wins fights — and life situations.',
      icon: '🧠',
    },
    {
      title: 'Respect & Humility',
      description: 'In Kyokushin, even the strongest fighter bows to their opponent. Winning doesn\'t mean disrespecting. Losing doesn\'t mean quitting. Children learn to respect teachers, parents, peers, and most importantly — themselves.',
      icon: '🙏',
    },
  ];

  return (
    <article className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-red-950/40 to-black py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-red-600/20 border border-red-600/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
            Youth Development
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            The Benefits of <span className="text-red-500">Full-Contact Training</span> for Youth
          </h1>
          <p className="text-gray-400 text-lg">
            Published February 13, 2026 · By Kyokushin Karate Foundation of India
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-xl text-gray-300 leading-relaxed mb-12">
          Every parent wants their child to be confident, disciplined, and physically fit. Many consider
          martial arts — but with dozens of styles available, how do you choose? If your goal is
          <strong> real-world results</strong> rather than just trophies, full-contact Kyokushin karate training
          offers benefits that no other sport or martial art can match. Here&apos;s why parents across India
          are choosing Kyokushin for their children.
        </p>

        {/* Benefits Grid */}
        <div className="space-y-8 mb-16">
          {benefits.map((benefit, i) => (
            <div key={i} className="bg-zinc-900/50 rounded-2xl p-8 border border-white/10 hover:border-red-600/30 transition-all">
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{benefit.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">{benefit.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What Age Can Kids Start? */}
        <div className="prose prose-invert prose-lg prose-red max-w-none">
          <h2 className="text-3xl font-bold text-white mt-12 mb-6">What Age Can Kids Start Kyokushin?</h2>
          <p className="text-gray-300">
            Children as young as <strong>5-6 years old</strong> can begin training. At this age, classes focus on
            basic movements, coordination, and the foundational principles of discipline and respect. Full-contact
            sparring is introduced gradually — typically from ages 8-10 — with appropriate protective gear and
            close instructor supervision. By their teenage years, students are confident, skilled fighters with
            years of conditioning behind them.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">&quot;But Isn&apos;t Full-Contact Dangerous?&quot;</h2>
          <p className="text-gray-300">
            This is the #1 concern parents have — and it&apos;s a valid question. The answer: <strong>Kyokushin
            is safer than most team sports</strong>. Studies show that football, rugby, and even basketball cause
            more youth injuries than martial arts. In a Kyokushin dojo:
          </p>
          <ul className="text-gray-300 space-y-2">
            <li>Training is supervised by certified, experienced instructors</li>
            <li>Sparring is matched by age, weight, and skill level</li>
            <li>Proper technique is taught before contact is introduced</li>
            <li>The culture emphasizes <strong>control</strong> — hurting your training partner is dishonorable</li>
            <li>Children are taught to distinguish between training and real confrontation</li>
          </ul>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">The Academic Connection</h2>
          <p className="text-gray-300">
            Multiple studies have shown that children who practice martial arts regularly perform better academically.
            The discipline of bowing, listening, repeating techniques hundreds of times, and persevering through
            difficult training directly translates to improved focus in classrooms. KKFI instructors routinely
            report that parents notice improvements in school performance within the first 3 months.
          </p>

          <blockquote className="border-l-4 border-red-600 pl-6 my-8 italic text-gray-400">
            &quot;One thousand days of training to forge, ten thousand days of training to polish. The path of
            true martial arts is one that requires patience.&quot;
            <br />— Sosai Masutatsu Oyama
          </blockquote>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-12">
          {[
            { stat: '250+', label: 'Youth Students' },
            { stat: '15+', label: 'Cities Across India' },
            { stat: '93%', label: 'Parent Satisfaction' },
            { stat: '5+', label: 'Age to Start' },
          ].map((item, i) => (
            <div key={i} className="bg-zinc-900/50 rounded-xl p-6 text-center border border-white/10">
              <div className="text-3xl font-black text-red-500">{item.stat}</div>
              <div className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-gradient-to-r from-red-950/30 to-zinc-900/50 rounded-2xl border border-red-600/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Enroll Your Child in Kyokushin Today</h3>
          <p className="text-gray-400 mb-6">
            Give your child the gift of discipline, confidence, and real self-defense skills.
            KKFI dojos across India welcome students from age 5 and up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dojos"
              className="inline-block px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all border border-white/10"
            >
              Find a Dojo Near You
            </Link>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all"
            >
              Register Now — ₹295 Only
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
              <Link href="/blog/history-kyokushin-india" className="text-red-400 hover:text-red-300 transition-colors">
                History of Kyokushin in India: From Sosai Oyama to Today →
              </Link>
            </li>
            <li>
              <Link href="/blog/kyokushin-grading-syllabus-2026" className="text-red-400 hover:text-red-300 transition-colors">
                Kyokushin Grading Syllabus 2026: Complete Belt Guide →
              </Link>
            </li>
            <li>
              <Link href="/dojos" className="text-red-400 hover:text-red-300 transition-colors">
                Find a KKFI Dojo Near You →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}
