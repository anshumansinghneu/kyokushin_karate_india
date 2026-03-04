'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Search, Award, Calendar, MapPin, AlertTriangle, Flame, TrendingUp, ArrowRight, ArrowLeft, Fingerprint, BadgeCheck, Clock, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';

interface VerifiedMember {
    name: string;
    membershipNumber: string;
    membershipStatus: string;
    membershipStartDate?: string;
    membershipEndDate?: string;
    currentBeltRank: string;
    role: string;
    profilePhotoUrl?: string;
    dojo?: { name: string; city: string } | null;
    lastPromotion?: { newBelt: string; promotionDate: string } | null;
    experience?: { years: number; months: number; display: string };
    totalPromotions?: number;
    city?: string;
    state?: string;
    createdAt?: string;
    beltHistory?: { newBelt: string; promotionDate: string }[];
}

const BELT_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
    White: { bg: 'bg-white', ring: 'ring-white/20', text: 'text-white' },
    Orange: { bg: 'bg-orange-500', ring: 'ring-orange-500/20', text: 'text-orange-400' },
    Blue: { bg: 'bg-blue-500', ring: 'ring-blue-500/20', text: 'text-blue-400' },
    Yellow: { bg: 'bg-yellow-400', ring: 'ring-yellow-400/20', text: 'text-yellow-400' },
    Green: { bg: 'bg-green-500', ring: 'ring-green-500/20', text: 'text-green-400' },
    Brown: { bg: 'bg-amber-700', ring: 'ring-amber-700/20', text: 'text-amber-500' },
    Black: { bg: 'bg-gray-800', ring: 'ring-gray-600/20', text: 'text-gray-300' },
};

function getBeltStyle(rank: string) {
    const key = Object.keys(BELT_COLORS).find(k => rank.includes(k));
    return key ? BELT_COLORS[key] : { bg: 'bg-gray-600', ring: 'ring-gray-600/20', text: 'text-gray-400' };
}

export default function VerifyPage() {
    const params = useParams();
    const router = useRouter();
    const membershipNumberFromUrl = params?.membershipNumber as string | undefined;

    const [searchQuery, setSearchQuery] = useState(membershipNumberFromUrl || '');
    const [member, setMember] = useState<VerifiedMember | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const doSearch = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setMember(null);
        setSearched(true);

        try {
            const res = await api.get(`/belts/verify/${encodeURIComponent(query.trim())}`);
            if (res.data?.data?.member) {
                setMember(res.data.data.member);
            } else {
                setError(res.data?.message || 'No member found with this membership number');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to connect to verification server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (membershipNumberFromUrl) {
            doSearch(membershipNumberFromUrl);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membershipNumberFromUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(searchQuery);
    };

    const beltStyle = member ? getBeltStyle(member.currentBeltRank) : null;
    const isActive = member?.membershipStatus === 'ACTIVE';

    return (
        <div className="min-h-screen bg-[#060606] text-white relative">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-950/[0.12] rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            {/* Top accent */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent" />

            <div className="relative z-10 max-w-xl mx-auto px-5 pt-6 sm:pt-8 pb-20">
                {/* Back link */}
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                    <Link href="/verify" className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-300 transition-colors mb-6 uppercase tracking-wider font-medium">
                        <ArrowLeft className="w-3 h-3" />
                        Back to search
                    </Link>
                </motion.div>

                {/* Compact search bar */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="mb-8"
                >
                    <div className={`flex items-center bg-white/[0.03] rounded-xl border transition-all duration-300 ${isFocused ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.06)]' : 'border-white/[0.06]'}`}>
                        <div className="pl-4 text-gray-600">
                            <Search className="w-[18px] h-[18px]" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Enter membership ID"
                            className="flex-1 px-3 py-3.5 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none font-mono"
                        />
                        <div className="pr-1.5">
                            <button
                                type="submit"
                                disabled={loading || !searchQuery.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 disabled:bg-white/[0.05] disabled:text-gray-600 transition-all"
                            >
                                {loading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Verify <ArrowRight className="w-3 h-3" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.form>

                <AnimatePresence mode="wait">
                    {/* Loading */}
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-20"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                        <Fingerprint className="w-5 h-5 text-red-500/60" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#060606] border border-white/[0.08] flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 border-2 border-red-500/60 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 font-medium">Verifying membership</p>
                                    <p className="text-[11px] text-gray-600 mt-1 font-mono">Checking KKFI records...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Error */}
                    {searched && !loading && error && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <div className="border border-red-500/10 bg-red-500/[0.03] rounded-2xl overflow-hidden">
                                <div className="px-6 py-10 text-center">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/[0.08] border border-red-500/10 flex items-center justify-center">
                                        <XCircle className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h2 className="text-base font-bold text-white mb-2">Membership Not Found</h2>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => { setSearched(false); setError(''); setSearchQuery(''); }}
                                        className="mt-5 px-5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all"
                                    >
                                        Try a different ID
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Success Result */}
                    {searched && !loading && member && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Verification badge / status */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className={`relative overflow-hidden rounded-2xl border ${
                                    isActive 
                                        ? 'border-green-500/15 bg-gradient-to-b from-green-500/[0.06] to-transparent' 
                                        : 'border-amber-500/15 bg-gradient-to-b from-amber-500/[0.06] to-transparent'
                                }`}
                            >
                                {/* Status header */}
                                <div className="flex items-center justify-between px-5 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        {isActive ? (
                                            <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                                                <BadgeCheck className="w-4 h-4 text-green-400" />
                                            </div>
                                        ) : member.membershipStatus === 'EXPIRED' ? (
                                            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            </div>
                                        ) : member.membershipStatus === 'REJECTED' ? (
                                            <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-amber-400" />
                                            </div>
                                        )}
                                        <div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-green-400' : 'text-amber-400'}`}>
                                                {isActive ? 'Verified Member' : member.membershipStatus === 'EXPIRED' ? 'Expired' : member.membershipStatus === 'REJECTED' ? 'Rejected' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    {member.membershipEndDate && (
                                        <span className="text-[10px] text-gray-600 font-mono">
                                            exp {new Date(member.membershipEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>

                                {/* Identity section */}
                                <div className="px-5 pb-5 pt-1">
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-shrink-0">
                                            {member.profilePhotoUrl ? (
                                                <img
                                                    src={member.profilePhotoUrl}
                                                    alt={member.name}
                                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/[0.08]"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xl font-black text-white/60">
                                                    {member.name.charAt(0)}
                                                </div>
                                            )}
                                            {isActive && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#060606] flex items-center justify-center">
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-black text-white truncate tracking-tight">{member.name}</h2>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-gray-400 font-mono">{member.membershipNumber}</span>
                                                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
                                                    {member.role === 'INSTRUCTOR' ? 'Instructor' : member.role === 'ADMIN' ? 'Admin' : 'Student'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Details card */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden"
                            >
                                <div className="divide-y divide-white/[0.04]">
                                    {/* Belt Rank - special treatment */}
                                    <div className="flex items-center justify-between px-5 py-4">
                                        <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Belt Rank</span>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-3.5 h-3.5 rounded-full ${beltStyle?.bg} ring-4 ${beltStyle?.ring}`} />
                                            <span className={`text-sm font-bold ${beltStyle?.text}`}>{member.currentBeltRank}</span>
                                        </div>
                                    </div>

                                    {/* Dojo */}
                                    {member.dojo && (
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Dojo</span>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold text-white">{member.dojo.name}</span>
                                                <p className="text-[11px] text-gray-600 flex items-center gap-1 justify-end mt-0.5">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {member.dojo.city}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Member since */}
                                    {member.membershipStartDate && (
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Member Since</span>
                                            <span className="text-sm font-semibold text-white">
                                                {new Date(member.membershipStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {member.experience && (
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Experience</span>
                                            <span className="text-sm font-semibold text-white font-mono">{member.experience.display}</span>
                                        </div>
                                    )}

                                    {/* Promotions */}
                                    {typeof member.totalPromotions === 'number' && member.totalPromotions > 0 && (
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Promotions</span>
                                            <div className="flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-sm font-semibold text-white">{member.totalPromotions}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Last promotion */}
                                    {member.lastPromotion && (
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Last Promotion</span>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold text-white">{member.lastPromotion.newBelt} Belt</span>
                                                <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                                                    {new Date(member.lastPromotion.promotionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-3 px-5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Image src="/kkfi-logo.avif" alt="KKFI" width={14} height={14} className="w-3.5 h-3.5 opacity-30" />
                                    <span className="text-[10px] text-gray-600">Kyokushin Karate Foundation of India</span>
                                </div>
                                <span className="text-[10px] text-gray-700 font-mono">
                                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </motion.div>

                            {/* Verify another */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="mt-8 text-center"
                            >
                                <button
                                    onClick={() => { setSearched(false); setMember(null); setSearchQuery(''); }}
                                    className="text-xs text-gray-600 hover:text-white transition-colors font-medium"
                                >
                                    Verify another member &rarr;
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
