"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";
import api from "@/lib/api";

interface Champion {
    id: string;
    name: string;
    currentBeltRank: string;
    profilePhotoUrl: string | null;
    dojo: {
        name: string;
        city: string;
    } | null;
}

interface Recognition {
    id: string;
    type: string;
    user: Champion;
}

interface MonthlyData {
    month: number;
    year: number;
    instructors: Recognition[];
    students: Recognition[];
}

export default function MonthlyChampions() {
    const [data, setData] = useState<MonthlyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/recognitions');
                setData(response.data.data);
            } catch (error) {
                console.error("Failed to fetch monthly champions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !data || (data.instructors.length === 0 && data.students.length === 0)) {
        return null; // Don't show section if no data
    }

    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });

    return (
        <section className="py-32 bg-zinc-950 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-zinc-900/50 to-black pointer-events-none" />

            {/* Animated Glow Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"
            />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-yellow-900/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-sm"
                    >
                        <Trophy className="w-4 h-4" />
                        <span>Hall of Fame</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white mb-6 uppercase italic tracking-tighter"
                    >
                        Champions of <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 drop-shadow-lg">{monthName}</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">Honoring those who exemplify the spirit of Osu through dedication, strength, and discipline.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Instructors Column */}
                    {data.instructors.length > 0 && (
                        <div className="space-y-10">
                            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                    <Medal className="w-8 h-8 text-yellow-500" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-wider">Top Instructors</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                {data.instructors.map((rec, index) => (
                                    <ChampionCard key={rec.id} champion={rec.user} type="INSTRUCTOR" index={index} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Students Column */}
                    {data.students.length > 0 && (
                        <div className="space-y-10">
                            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <Star className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-wider">Top Students</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                {data.students.map((rec, index) => (
                                    <ChampionCard key={rec.id} champion={rec.user} type="STUDENT" index={index} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function ChampionCard({ champion, type, index }: { champion: Champion; type: string; index: number }) {
    const isGold = index === 0;
    const accentColor = type === 'INSTRUCTOR' ? 'yellow' : 'blue';
    const borderColor = type === 'INSTRUCTOR' ? 'border-yellow-500/30' : 'border-blue-500/30';
    const glowColor = type === 'INSTRUCTOR' ? 'shadow-yellow-500/20' : 'shadow-blue-500/20';

    return (
        <motion.div
            initial={{ opacity: 0, x: type === 'INSTRUCTOR' ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className={`group relative bg-zinc-900/80 backdrop-blur-sm border ${borderColor} rounded-3xl overflow-hidden hover:border-opacity-100 transition-all duration-500 hover:shadow-2xl ${glowColor}`}
        >
            <div className="flex flex-col sm:flex-row h-full">
                {/* Image Section */}
                <div className="sm:w-2/5 relative h-64 sm:h-auto overflow-hidden">
                    <img
                        src={champion.profilePhotoUrl || "/default-avatar.png"}
                        alt={champion.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4">
                        <div className={`w-12 h-12 rounded-xl ${type === 'INSTRUCTOR' ? 'bg-yellow-500' : 'bg-blue-500'} flex items-center justify-center text-black font-black text-xl shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-300`}>
                            #{index + 1}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-8 flex flex-col justify-center relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Trophy className={`w-32 h-32 ${type === 'INSTRUCTOR' ? 'text-yellow-500' : 'text-blue-500'}`} />
                    </div>

                    <div className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-3 w-fit ${type === 'INSTRUCTOR' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {champion.currentBeltRank} Belt
                    </div>

                    <h4 className="text-3xl font-black text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                        {champion.name}
                    </h4>

                    {champion.dojo && (
                        <div className="flex items-center gap-2 text-gray-400 mt-2">
                            <div className="w-1 h-1 rounded-full bg-gray-500" />
                            <p className="text-sm font-medium">{champion.dojo.name}</p>
                        </div>
                    )}

                    {champion.dojo?.city && (
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{champion.dojo.city}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
