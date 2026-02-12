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
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
                <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                            <Award className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Our Senseis</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight">
                            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">Instructors</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Certified Kyokushin Karate instructors dedicated to passing on the spirit of OSU.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <KarateLoader />
                    </div>
                ) : instructors.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No instructors listed yet</h3>
                        <p className="text-sm text-gray-500 mt-1">Instructor profiles will appear here once approved.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {instructors.map((instructor, i) => (
                            <motion.div
                                key={instructor.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="glass-card overflow-hidden group hover:border-red-500/30 transition-all duration-300"
                            >
                                <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                                    {instructor.profilePhotoUrl ? (
                                        <img
                                            src={instructor.profilePhotoUrl}
                                            alt={instructor.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl font-black text-white/20">{instructor.name.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                    {/* Belt badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${BELT_STYLES[instructor.currentBeltRank] || 'bg-gray-600 text-white'}`}>
                                            {instructor.currentBeltRank} Belt
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-lg font-black text-white mb-1 group-hover:text-red-500 transition-colors">
                                        {instructor.name}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Sensei</p>

                                    <div className="space-y-2 mb-4">
                                        {instructor.dojo && (
                                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                                {instructor.dojo.name}, {instructor.dojo.city}
                                            </p>
                                        )}
                                        {instructor.createdAt && (
                                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                                <Award className="w-3.5 h-3.5 text-yellow-500" />
                                                {getExperience(instructor.createdAt)} experience
                                            </p>
                                        )}
                                    </div>

                                    {instructor.membershipNumber && (
                                        <Link
                                            href={`/verify/${instructor.membershipNumber}`}
                                            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors py-2 -mb-1 min-h-[44px] active:opacity-70"
                                        >
                                            Verify Credentials <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
