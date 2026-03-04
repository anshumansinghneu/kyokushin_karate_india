'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Search, Award, Calendar, MapPin, AlertTriangle, Flame, TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react';
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

const BELT_COLORS: Record<string, string> = {
    White: 'bg-white',
    Orange: 'bg-orange-500',
    Blue: 'bg-blue-500',
    Yellow: 'bg-yellow-400',
    Green: 'bg-green-500',
    Brown: 'bg-amber-700',
    Black: 'bg-gray-800 border border-gray-600',
};

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

    const beltDot = member ? BELT_COLORS[member.currentBeltRank] || '' : '';
    const isActive = member?.membershipStatus === 'ACTIVE';

    return (
        <div className="min-h-screen bg-[#080808] text-white">
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />

            <div className="max-w-2xl mx-auto px-5 pt-8 pb-20">
                {/* Back link + search */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/verify" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                    </Link>
                </div>

                {/* Compact search bar */}
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className={`flex items-center bg-[#111] rounded-xl border transition-colors duration-200 ${isFocused ? 'border-white/20' : 'border-white/[0.08]'}`}>
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
                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 disabled:bg-white/[0.06] disabled:text-gray-600 transition-colors"
                            >
                                {loading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Verify <ArrowRight className="w-3 h-3" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Loading */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center"
                    >
                        <div className="w-8 h-8 mx-auto mb-3 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Looking up membership...</p>
                    </motion.div>
                )}

                {/* Error */}
                {searched && !loading && error && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-red-500/15 rounded-xl overflow-hidden"
                    >
                        <div className="px-5 py-8 text-center">
                            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <h2 className="text-base font-semibold text-white mb-1">No member found</h2>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">{error}</p>
                            <button
                                onClick={() => { setSearched(false); setError(''); setSearchQuery(''); }}
                                className="mt-4 text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
                            >
                                Try a different ID
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Success Result */}
                {searched && !loading && member && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Status bar */}
                        <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border border-b-0 ${
                            isActive 
                                ? 'bg-green-500/[0.06] border-green-500/15' 
                                : 'bg-amber-500/[0.06] border-amber-500/15'
                        }`}>
                            <div className="flex items-center gap-2">
                                {isActive ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : member.membershipStatus === 'EXPIRED' ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                ) : member.membershipStatus === 'REJECTED' ? (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                ) : (
                                    <Shield className="w-4 h-4 text-amber-400" />
                                )}
                                <span className={`text-xs font-semibold ${isActive ? 'text-green-400' : 'text-amber-400'}`}>
                                    {isActive ? 'Verified — Active Member' : member.membershipStatus === 'EXPIRED' ? 'Membership Expired' : member.membershipStatus === 'REJECTED' ? 'Membership Rejected' : 'Pending Verification'}
                                </span>
                            </div>
                            {member.membershipEndDate && (
                                <span className="text-[11px] text-gray-500">
                                    exp. {new Date(member.membershipEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>

                        {/* Card body */}
                        <div className="border border-white/[0.08] border-t-0 rounded-b-xl bg-[#0d0d0d]">
                            {/* Identity row */}
                            <div className="flex items-start gap-4 p-5 border-b border-white/[0.06]">
                                <div className="flex-shrink-0">
                                    {member.profilePhotoUrl ? (
                                        <img
                                            src={member.profilePhotoUrl}
                                            alt={member.name}
                                            className="w-14 h-14 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-lg font-bold text-gray-400">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-white truncate">{member.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] text-gray-500 font-mono">{member.membershipNumber}</span>
                                        <span className="text-gray-700">·</span>
                                        <span className="text-[11px] text-gray-500">
                                            {member.role === 'INSTRUCTOR' ? 'Instructor' : member.role === 'ADMIN' ? 'Admin' : 'Student'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="divide-y divide-white/[0.05]">
                                {/* Belt */}
                                <div className="flex items-center justify-between px-5 py-3.5">
                                    <span className="text-xs text-gray-500">Belt Rank</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${beltDot}`} />
                                        <span className="text-sm font-medium text-white">{member.currentBeltRank}</span>
                                    </div>
                                </div>

                                {/* Dojo */}
                                {member.dojo && (
                                    <div className="flex items-center justify-between px-5 py-3.5">
                                        <span className="text-xs text-gray-500">Dojo</span>
                                        <div className="text-right">
                                            <span className="text-sm font-medium text-white">{member.dojo.name}</span>
                                            <p className="text-[11px] text-gray-600">{member.dojo.city}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Member since */}
                                {member.membershipStartDate && (
                                    <div className="flex items-center justify-between px-5 py-3.5">
                                        <span className="text-xs text-gray-500">Member Since</span>
                                        <span className="text-sm font-medium text-white">
                                            {new Date(member.membershipStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}

                                {/* Experience */}
                                {member.experience && (
                                    <div className="flex items-center justify-between px-5 py-3.5">
                                        <span className="text-xs text-gray-500">Experience</span>
                                        <span className="text-sm font-medium text-white">{member.experience.display}</span>
                                    </div>
                                )}

                                {/* Promotions */}
                                {typeof member.totalPromotions === 'number' && member.totalPromotions > 0 && (
                                    <div className="flex items-center justify-between px-5 py-3.5">
                                        <span className="text-xs text-gray-500">Promotions</span>
                                        <span className="text-sm font-medium text-white">{member.totalPromotions}</span>
                                    </div>
                                )}

                                {/* Last promotion */}
                                {member.lastPromotion && (
                                    <div className="flex items-center justify-between px-5 py-3.5">
                                        <span className="text-xs text-gray-500">Last Promotion</span>
                                        <div className="text-right">
                                            <span className="text-sm font-medium text-white">{member.lastPromotion.newBelt} Belt</span>
                                            <p className="text-[11px] text-gray-600">
                                                {new Date(member.lastPromotion.promotionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Image src="/kkfi-logo.avif" alt="KKFI" width={16} height={16} className="w-4 h-4 opacity-40" />
                                    <span className="text-[10px] text-gray-600">Kyokushin Karate Foundation of India</span>
                                </div>
                                <span className="text-[10px] text-gray-700">
                                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Verify another */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => { setSearched(false); setMember(null); setSearchQuery(''); }}
                                className="text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                Verify another member &rarr;
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
