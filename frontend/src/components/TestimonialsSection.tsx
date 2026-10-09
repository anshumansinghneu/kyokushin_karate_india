'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Section, { Heading } from '@/components/brand/Section';

interface Testimonial {
    id: string;
    name: string;
    role: string;
    belt: string;
    dojo: string;
    quote: string;
    imageUrl?: string;
    rating: number;
}

// Hardcoded testimonials as fallback (can be supplemented by API later)
const DEFAULT_TESTIMONIALS: Testimonial[] = [
    {
        id: '1',
        name: 'Rahul Sharma',
        role: 'Student',
        belt: 'Green Belt',
        dojo: 'Mumbai Central Dojo',
        quote: 'Kyokushin has transformed my life. The discipline, the respect, and the physical conditioning — it goes far beyond just learning to fight. The KKFI community is like a second family.',
        rating: 5,
    },
    {
        id: '2',
        name: 'Priya Patel',
        role: 'Student',
        belt: 'Blue Belt',
        dojo: 'Pune Warriors Dojo',
        quote: 'As a woman in martial arts, I was nervous at first. But the instructors at KKFI made me feel welcome from day one. I\'ve gained confidence, strength, and lifelong friends.',
        rating: 5,
    },
    {
        id: '3',
        name: 'Vikram Singh',
        role: 'Instructor',
        belt: 'Black Belt 2nd Dan',
        dojo: 'Delhi Kyokushin Academy',
        quote: 'Teaching Kyokushin through KKFI\'s platform has been incredible. The belt tracking, tournament management, and student progress tools make running a dojo so much smoother.',
        rating: 5,
    },
    {
        id: '4',
        name: 'Ananya Desai',
        role: 'Parent',
        belt: 'N/A',
        dojo: 'Bangalore South Dojo',
        quote: 'My son started training at age 8 and the change has been remarkable. Better focus in school, more respectful at home, and he absolutely loves going to class. Thank you KKFI!',
        rating: 5,
    },
    {
        id: '5',
        name: 'Arjun Mehta',
        role: 'Student',
        belt: 'Brown Belt',
        dojo: 'Ahmedabad Dojo',
        quote: 'Competing in KKFI tournaments gave me the experience to represent India internationally. The level of organization and support is world-class. OSU!',
        rating: 5,
    },
];

export default function TestimonialsSection() {
    const [testimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    const goTo = (index: number) => {
        setDirection(index > current ? 1 : -1);
        setCurrent(index);
    };

    const next = () => {
        setDirection(1);
        setCurrent(prev => (prev + 1) % testimonials.length);
    };

    const prev = () => {
        setDirection(-1);
        setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length);
    };

    // Auto-advance, paused while someone is reading or interacting, and never under reduced motion.
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const timer = setInterval(next, 7000);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, paused]);

    const t = testimonials[current];

    return (
        <Section rhythm="open" width="base" className="bg-black">
            <div
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={() => setPaused(false)}
            >
                <Heading size="title" className="text-white/70">From the dojo floor</Heading>

                <div className="relative mt-10 min-h-[18rem] sm:min-h-[16rem]" aria-live="polite">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.figure
                            key={current}
                            custom={direction}
                            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <blockquote className="max-w-[34ch] text-balance text-[clamp(1.5rem,3.4vw,2.6rem)] font-extrabold leading-[1.15] tracking-[-0.015em] text-white">
                                &ldquo;{t.quote}&rdquo;
                            </blockquote>
                            <figcaption className="mt-8 text-white/70">
                                <span className="font-bold text-white">{t.name}</span>
                                <span className="mx-2 text-white/30" aria-hidden="true">/</span>
                                {t.belt !== 'N/A' ? `${t.belt}, ` : `${t.role}, `}{t.dojo}
                            </figcaption>
                        </motion.figure>
                    </AnimatePresence>
                </div>

                <div className="mt-10 flex items-center gap-6">
                    <div className="flex gap-2">
                        <button onClick={prev} aria-label="Previous story" className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button onClick={next} aria-label="Next story" className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex gap-1" role="tablist" aria-label="Stories">
                        {testimonials.map((item, i) => (
                            <button
                                key={item.id}
                                role="tab"
                                aria-selected={i === current}
                                aria-label={`Story ${i + 1} of ${testimonials.length}`}
                                onClick={() => goTo(i)}
                                className="flex h-11 w-8 items-center justify-center"
                            >
                                <span className={`h-0.5 w-full transition-colors duration-300 ${i === current ? 'bg-white' : 'bg-white/20'}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    );
}
