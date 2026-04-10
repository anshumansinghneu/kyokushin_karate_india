'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Users, Star, ExternalLink, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import KarateLoader from '@/components/KarateLoader';

interface Instructor {
    id: string;
    name: string;
    currentBeltRank: string;
    profilePhotoUrl?: string;
    city?: string;
    state?: string;
    membershipNumber?: string;
    createdAt?: string;
    dojo?: { name: string; city: string } | null;
}

const BELT_STYLES: Record<string, string> = {
    White: 'bg-white text-black',
    Orange: 'bg-orange-500 text-white',
    Blue: 'bg-blue-500 text-white',
    Yellow: 'bg-yellow-500 text-white',
    Green: 'bg-green-500 text-white',
    Brown: 'bg-amber-700 text-white',
    Black: 'bg-black text-red-500 border border-red-500/50',
};

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const res = await api.get('/users/public-instructors');
                if (res.data?.data?.instructors) {
                    setInstructors(res.data.data.instructors);
                }
            } catch (err) {
                console.error('Failed to fetch instructors', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructors();
    }, []);

    const getExperience = (createdAt?: string) => {
        if (!createdAt) return '';
        const years = Math.floor((Date.now() - new Date(createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return years > 0 ? `${years}+ year${years > 1 ? 's' : ''}` : 'New';
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            {/* Subtle top vignette */}
            <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />

            {/* ── Hero ── */}
            <div className="relative pt-28 pb-10 md:pt-32 md:pb-12 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-center flex flex-col items-center"
                    >
                        <h1 className="font-black uppercase leading-[0.9] tracking-tighter mb-4" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)' }}>
                            <span className="inline-flex items-center gap-3 md:gap-4">
                                <span className="text-white">OUR</span>
                                <img src="/kkfi-logo.png" alt="KKFI" className="w-10 h-10 md:w-14 md:h-14 inline-block rounded-full border-2 border-white/10 shadow-[0_0_20px_rgba(220,38,38,0.2)]" />
                                <span
                                    className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                                    style={{
                                        background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text',
                                        color: 'transparent',
                                    }}
                                >SENSEIS</span>
                            </span>
                        </h1>

                        {/* Divider with count */}
                        <div className="flex items-center gap-4 md:gap-6 w-full max-w-xl mb-4">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/[0.06]" />
                            {!loading && instructors.length > 0 && (
                                <>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-extrabold text-white">{instructors.length}</span>
                                        <span className="text-[8px] font-semibold text-zinc-600 uppercase tracking-widest">Instructors</span>
                                    </div>
                                </>
                            )}
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/[0.06]" />
                        </div>

                        <p className="text-xs md:text-sm text-zinc-600 max-w-md leading-relaxed">
                            Certified Kyokushin Karate instructors across India.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Instructor Grid ── */}
            <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <KarateLoader />
                    </div>
                ) : instructors.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-10 h-10 text-white/[0.06] mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-white/80">No Instructors Listed</h3>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-5">
                        {instructors.map((instructor, i) => {
                            const initials = instructor.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                            return (
                                <motion.div
                                    key={instructor.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.1 }}
                                    transition={{ delay: (i % 4) * 0.08, duration: 0.6 }}
                                    className="group w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
                                >
                                    <div className="relative flex flex-col h-[360px] rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden transition-all duration-500 hover:border-red-600/15 hover:-translate-y-1 hover:shadow-[0_0_40px_-12px_rgba(220,38,38,0.15)]">
                                        {/* Sweep light */}
                                        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl">
                                            <div className="absolute top-0 left-[-100%] h-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
                                        </div>

                                        {/* Photo */}
                                        <div className="relative h-[55%] w-full overflow-hidden bg-black">
                                            {instructor.profilePhotoUrl ? (
                                                <img
                                                    src={instructor.profilePhotoUrl}
                                                    alt={instructor.name}
                                                    className="w-full h-full object-cover object-top filter grayscale contrast-[1.1] opacity-80 group-hover:scale-105 group-hover:grayscale-[30%] group-hover:opacity-100 transition-all duration-1000 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#080808] flex items-center justify-center">
                                                    <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                                        <span className="text-2xl font-black text-red-500/60">{initials}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />

                                            {/* Belt badge */}
                                            <div className="absolute top-3 right-3 z-20">
                                                <span className={`px-2.5 py-1 rounded text-[8px] font-extrabold uppercase tracking-[1.5px] ${BELT_STYLES[instructor.currentBeltRank] || 'bg-zinc-700 text-white/70'}`}>
                                                    {instructor.currentBeltRank}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="relative -mt-6 px-5 pb-5 flex flex-col flex-1 z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-[2px] h-3.5 rounded-full bg-red-600" />
                                                <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-[2px]">Sensei</span>
                                            </div>

                                            <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug mb-2">
                                                {instructor.name}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-auto text-[11px] text-zinc-500">
                                                {instructor.dojo && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 opacity-40" />
                                                        <span className="truncate">{instructor.dojo.name}, {instructor.dojo.city}</span>
                                                    </span>
                                                )}
                                                {instructor.membershipNumber && (
                                                    <>
                                                        {instructor.dojo && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
                                                        <Link
                                                            href={`/verify/${instructor.membershipNumber}`}
                                                            className="flex items-center gap-1 text-red-500/70 hover:text-red-400 transition-colors"
                                                        >
                                                            Verify <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
