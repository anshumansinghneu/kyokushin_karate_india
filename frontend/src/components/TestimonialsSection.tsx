'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

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

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [current]);

    const t = testimonials[current];

    return (
        <section className="relative py-20 sm:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />

            <div className="relative max-w-5xl mx-auto px-4 z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                        <Users className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Success Stories</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight text-white">
                        What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">Warriors</span> Say
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Hear from students, instructors, and parents about their Kyokushin journey with KKFI.
                    </p>
                </motion.div>

                {/* Testimonial Card */}
                <div className="relative max-w-3xl mx-auto">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={current}
                            custom={direction}
                            initial={{ opacity: 0, x: direction * 80 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 80 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="glass-card p-8 sm:p-10"
                        >
                            <Quote className="w-10 h-10 text-red-500/30 mb-4" />

                            <p className="text-lg sm:text-xl text-gray-200 font-medium leading-relaxed mb-8 italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-lg font-black text-white">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{t.name}</h4>
                                        <p className="text-xs text-gray-400">{t.belt} • {t.dojo}</p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Nav arrows */}
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-14 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-14 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === current ? 'w-8 bg-red-500' : 'w-1.5 bg-white/20 hover:bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
