import type { Metadata } from 'next';
import Reveal from '@/components/brand/Reveal';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede, PullQuote } from '../_components/article';

const guide = GUIDES[1];

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
      <ArticleHero
        category={guide.category}
        title="The Benefits of Full-Contact Training for Youth"
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
          Every parent wants their child to be confident, disciplined, and physically fit. Many consider
          martial arts — but with dozens of styles available, how do you choose? If your goal is
          <strong> real-world results</strong> rather than just trophies, full-contact Kyokushin karate training
          offers benefits that no other sport or martial art can match. Here&apos;s why parents across India
          are choosing Kyokushin for their children.
        </Lede>
      </ArticleBody>

      {/* Six benefits: two ruled columns, each heading leading its own paragraph. */}
      <section aria-label="Benefits" className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-x-12 md:grid-cols-2">
          {benefits.map((benefit, i) => (
            <Reveal key={benefit.title} delay={(i % 2) * 0.08} className="border-t border-white/15 py-8">
              <h2 className="text-balance text-2xl font-extrabold leading-tight tracking-[-0.01em] text-white">{benefit.title}</h2>
              <p className="mt-3 max-w-[56ch] text-pretty text-[1.0625rem] leading-[1.75] text-white/75">{benefit.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <ArticleBody>
        <h2>What Age Can Kids Start Kyokushin?</h2>
        <p>
          Children as young as <strong>5-6 years old</strong> can begin training. At this age, classes focus on
          basic movements, coordination, and the foundational principles of discipline and respect. Full-contact
          sparring is introduced gradually — typically from ages 8-10 — with appropriate protective gear and
          close instructor supervision. By their teenage years, students are confident, skilled fighters with
          years of conditioning behind them.
        </p>

        <h2>&quot;But Isn&apos;t Full-Contact Dangerous?&quot;</h2>
        <p>
          This is the #1 concern parents have — and it&apos;s a valid question. The answer: <strong>Kyokushin
          is safer than most team sports</strong>. Studies show that football, rugby, and even basketball cause
          more youth injuries than martial arts. In a Kyokushin dojo:
        </p>
        <ul>
          <li>Training is supervised by certified, experienced instructors</li>
          <li>Sparring is matched by age, weight, and skill level</li>
          <li>Proper technique is taught before contact is introduced</li>
          <li>The culture emphasizes <strong>control</strong> — hurting your training partner is dishonorable</li>
          <li>Children are taught to distinguish between training and real confrontation</li>
        </ul>

        <h2>The Academic Connection</h2>
        <p>
          Multiple studies have shown that children who practice martial arts regularly perform better academically.
          The discipline of bowing, listening, repeating techniques hundreds of times, and persevering through
          difficult training directly translates to improved focus in classrooms. KKFI instructors routinely
          report that parents notice improvements in school performance within the first 3 months.
        </p>

        <PullQuote cite="Sosai Masutatsu Oyama">
          &quot;One thousand days of training to forge, ten thousand days of training to polish. The path of
          true martial arts is one that requires patience.&quot;
        </PullQuote>

        {/* The figures as one quiet ruled row, not a wall of big numbers. */}
        <dl className="!my-12 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-white/15 py-8 sm:grid-cols-4">
          {[
            { stat: '250+', label: 'Youth Students' },
            { stat: '15+', label: 'Cities Across India' },
            { stat: '93%', label: 'Parent Satisfaction' },
            { stat: '5+', label: 'Age to Start' },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-sm text-white/60">{item.label}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-white tabular-nums">{item.stat}</dd>
            </div>
          ))}
        </dl>
      </ArticleBody>

      <ArticleCta
        title="Enroll Your Child in Kyokushin Today"
        body="Give your child the gift of discipline, confidence, and real self-defense skills. KKFI dojos across India welcome students from age 5 and up."
        actions={[
          { href: '/register', label: 'Register Now — ₹295 Only', primary: true },
          { href: '/find-a-dojo', label: 'Find a Dojo Near You' },
        ]}
      />

      <KeepReading
        links={[
          { href: '/blog/kyokushin-vs-shotokan', title: 'What Makes Kyokushin Different from Shotokan?', note: 'Karate Knowledge' },
          { href: '/blog/history-kyokushin-india', title: 'History of Kyokushin in India: From Sosai Oyama to Today', note: 'Our Heritage' },
          { href: '/blog/kyokushin-grading-syllabus-2026', title: 'Kyokushin Grading Syllabus 2026: Complete Belt Guide', note: 'Official Syllabus' },
          { href: '/find-a-dojo', title: 'Find a KKFI Dojo Near You', note: 'Dojos' },
        ]}
      />
    </article>
  );
}
