import type { Metadata } from 'next';
import Reveal from '@/components/brand/Reveal';
import { ArticleBody, ArticleCta, ArticleHero, AUTHOR, GUIDES, KeepReading, Lede, PullQuote } from '../_components/article';

const guide = GUIDES[1];

export const metadata: Metadata = {
  title: 'Benefits of Full-Contact Karate Training for Youth | Martial Arts for Kids',
  description: 'What full-contact Kyokushin karate can offer children and teens: confidence, discipline, self-defence awareness and fitness. A guide for parents from KKFI.',
  keywords: [
    'martial arts for kids near me',
    'karate for children India',
    'full contact karate youth benefits',
    'self-defense classes for kids',
    'martial arts for children',
    'Kyokushin karate kids',
    'karate anti-bullying',
    'kids karate classes India',
  ],
  alternates: {
    canonical: 'https://www.kyokushinfoundation.com/blog/full-contact-training-youth-benefits',
  },
  openGraph: {
    title: 'The Benefits of Full-Contact Karate Training for Youth',
    description: 'What Kyokushin full-contact karate can offer children: confidence, discipline, fitness and self-defence awareness.',
    type: 'article',
    publishedTime: '2026-02-13T00:00:00.000Z',
    authors: ['Kyokushin Karate Foundation of India'],
    tags: ['Youth Karate', 'Kids Martial Arts', 'Full Contact', 'Child Development', 'Fitness'],
  },
};

export default function YouthBenefits() {
  const benefits = [
    {
      title: 'Confidence That Is Earned',
      description: 'When a child meets a real physical challenge and comes through it, the confidence that follows is earned rather than told. Training teaches children that they can take a knock, get back up and keep going, a habit that is just as useful at school and with friends.',
    },
    {
      title: 'Self-Defence Awareness',
      description: 'Kyokushin sparring involves real contact to the body and legs, so children learn what a committed strike feels like and how to stay calm and respond to it. Good instruction also teaches them that walking away from trouble comes first.',
    },
    {
      title: 'Physical Fitness',
      description: 'A Kyokushin class asks a lot of the body: basics, kicks, pad work and conditioning. Along the way children build stamina, flexibility, strength and coordination, which is welcome at an age when much of the day is spent sitting.',
    },
    {
      title: 'Discipline & Focus',
      description: 'The dojo has clear rules: bow when you enter, answer instructors with "Osu!", do not talk out of turn. Regular training gives children a routine with clear expectations, and that habit can carry over to homework and responsibilities at home.',
    },
    {
      title: 'Emotional Regulation',
      description: 'Sparring asks children to manage fear, frustration and adrenaline while it is happening. They learn that anger makes you sloppy, panic makes you freeze, and calm focus serves you better, in the dojo and outside it.',
    },
    {
      title: 'Respect & Humility',
      description: 'In Kyokushin, fighters bow to their opponent before and after they spar. Winning is no reason to disrespect anyone, and losing is no reason to quit. Children learn to respect their teachers, parents, training partners and themselves.',
    },
  ];

  return (
    <article className="min-h-screen text-white">
      <ArticleHero
        kanji="育"
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
          Every parent wants their child to be confident, disciplined and fit. Many look at martial arts,
          but with so many styles to choose from, where do you start? Kyokushin is a full-contact style:
          children learn to take and deliver real strikes, under supervision, as their skill grows. Here is
          what that kind of training can offer a child, and what to ask about before you enrol.
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
          Young children can begin with classes built around basic movement, coordination, and the habits of
          discipline and respect. Contact sparring is brought in gradually, as a child&apos;s skill and control
          develop, with protective gear and close supervision. Starting ages and class groups vary from dojo
          to dojo, so ask your nearest KKFI dojo what it offers for your child&apos;s age.
        </p>

        <h2>&quot;But Isn&apos;t Full-Contact Dangerous?&quot;</h2>
        <p>
          It is the question most parents ask first, and a fair one. Kyokushin involves real contact, and no
          contact sport is free of risk. What matters is how training is run. Under Kyokushin&apos;s knockdown
          rules, hand strikes to the head or face are not allowed. In a well-run dojo:
        </p>
        <ul>
          <li>Training is supervised by experienced instructors</li>
          <li>Sparring partners are matched by age, size and skill</li>
          <li>Technique is taught before contact is introduced</li>
          <li>The culture values <strong>control</strong>: hurting your training partner is not respected</li>
          <li>Children learn the difference between training and a real confrontation</li>
        </ul>

        <h2>Focus at School and at Home</h2>
        <p>
          Bowing in, listening, repeating a technique many times and sticking with hard training all ask
          for focus and patience. Those are the same habits a child needs in the classroom, and the dojo
          gives them regular practice at them.
        </p>

        <PullQuote cite="Miyamoto Musashi, as quoted by Sosai Oyama">
          &quot;One thousand days to forge, ten thousand to polish.&quot;
        </PullQuote>
      </ArticleBody>

      <ArticleCta
        title="Enrol Your Child in Kyokushin"
        body="Give your child a place to build discipline, confidence and real self-defence skills. Find a KKFI dojo near you and ask about its classes for children."
        actions={[
          { href: '/register', label: 'Register Now', primary: true },
          { href: '/find-a-dojo', label: 'Find a Dojo Near You' },
        ]}
      />

      <KeepReading
        links={[
          { href: '/blog/kyokushin-vs-shotokan', title: 'What Makes Kyokushin Different from Shotokan?', note: 'Karate Knowledge' },
          { href: '/blog/history-kyokushin-india', title: 'History of Kyokushin in India: From Sosai Oyama to Today', note: 'Our Heritage' },
          { href: '/blog/kyokushin-grading-syllabus-2026', title: 'Kyokushin Grading Syllabus 2026: Belt Guide', note: 'KKFI Syllabus' },
          { href: '/find-a-dojo', title: 'Find a KKFI Dojo Near You', note: 'Dojos' },
        ]}
      />
    </article>
  );
}
