'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Search, Award, Calendar, MapPin, AlertTriangle, Flame, TrendingUp } from 'lucide-react';
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
    White: 'bg-white text-black border-gray-300',
    Orange: 'bg-orange-500 text-white border-orange-600',
    Blue: 'bg-blue-500 text-white border-blue-600',
    Yellow: 'bg-yellow-500 text-white border-yellow-600',
    Green: 'bg-green-500 text-white border-green-600',
    Brown: 'bg-amber-700 text-white border-amber-800',
    Black: 'bg-black text-white border-gray-600',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
    ACTIVE: { icon: <CheckCircle className="w-6 h-6" />, color: 'text-green-500', text: 'Active Member' },
    EXPIRED: { icon: <AlertTriangle className="w-6 h-6" />, color: 'text-yellow-500', text: 'Membership Expired' },
    PENDING: { icon: <Shield className="w-6 h-6" />, color: 'text-yellow-500', text: 'Pending Verification' },
    REJECTED: { icon: <XCircle className="w-6 h-6" />, color: 'text-red-500', text: 'Membership Rejected' },
};

export default function VerifyPage() {
    const params = useParams();
    const membershipNumberFromUrl = params?.membershipNumber as string | undefined;

    const [searchQuery, setSearchQuery] = useState(membershipNumberFromUrl || '');
    const [member, setMember] = useState<VerifiedMember | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

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

    // Auto-search when coming from QR code URL
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

    const statusCfg = member ? STATUS_CONFIG[member.membershipStatus] || STATUS_CONFIG.PENDING : null;
    const beltClass = member ? BELT_COLORS[member.currentBeltRank] || '' : '';

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
            {/* Simple Header */}
            <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/kkfi-logo.avif" alt="KKFI" width={32} height={32} className="w-8 h-8" />
                        <div>
                            <h1 className="text-sm font-black tracking-tight">KYOKUSHIN KARATE</h1>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider">FOUNDATION OF INDIA</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold">
                        <Shield className="w-4 h-4" />
                        Public Verification
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-16">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Member Verification Portal</span>
                    </div>
                    <h1 className="text-4xl font-black mb-3">Verify Membership</h1>
                    <p className="text-gray-400">
                        Enter a KKFI membership number to verify a member&apos;s belt rank and status
                    </p>
                </motion.div>

                {/* Search Form */}
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="flex gap-2 mb-8"
                >
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="e.g. KKI-2025-MUM-00001"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="px-6 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-all"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Verify'
                        )}
                    </button>
                </motion.form>

                {/* Result */}
                {searched && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error ? (
                            <div className="glass-card p-8 text-center">
                                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                                <h2 className="text-xl font-bold text-red-400 mb-2">Not Found</h2>
                                <p className="text-gray-400">{error}</p>
                            </div>
                        ) : member ? (
                            <div className="glass-card overflow-hidden">
                                {/* Status Banner */}
                                <div className={`px-6 py-4 ${member.membershipStatus === 'ACTIVE' ? 'bg-green-500/10 border-b border-green-500/20' : 'bg-yellow-500/10 border-b border-yellow-500/20'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={statusCfg?.color}>{statusCfg?.icon}</span>
                                        <div>
                                            <h3 className={`font-bold ${statusCfg?.color}`}>{statusCfg?.text}</h3>
                                            {member.membershipEndDate && (
                                                <p className="text-xs text-gray-400">
                                                    Valid until: {new Date(member.membershipEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Member Details */}
                                <div className="p-6">
                                    <div className="flex items-start gap-6">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {member.profilePhotoUrl ? (
                                                <img
                                                    src={member.profilePhotoUrl}
                                                    alt={member.name}
                                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-2xl font-black text-white">
                                                    {member.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h2 className="text-2xl font-black text-white">{member.name}</h2>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {member.role === 'INSTRUCTOR' ? 'Instructor' : member.role === 'ADMIN' ? 'Administrator' : 'Student'}
                                            </p>
                                            <p className="text-xs font-mono text-gray-500 mt-1">{member.membershipNumber}</p>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        {/* Belt Rank */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Award className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Belt Rank</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full border-2 ${beltClass}`} />
                                                <span className="font-bold text-white">{member.currentBeltRank} Belt</span>
                                            </div>
                                        </div>

                                        {/* Dojo */}
                                        {member.dojo && (
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dojo</span>
                                                </div>
                                                <p className="font-bold text-white text-sm">{member.dojo.name}</p>
                                                <p className="text-xs text-gray-500">{member.dojo.city}</p>
                                            </div>
                                        )}

                                        {/* Member Since */}
                                        {member.membershipStartDate && (
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member Since</span>
                                                </div>
                                                <p className="font-bold text-white text-sm">
                                                    {new Date(member.membershipStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )}

                                        {/* Experience */}
                                        {member.experience && (
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Flame className="w-4 h-4 text-orange-400" />
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Experience</span>
                                                </div>
                                                <p className="font-bold text-white text-sm">{member.experience.display}</p>
                                            </div>
                                        )}

                                        {/* Total Promotions */}
                                        {typeof member.totalPromotions === 'number' && member.totalPromotions > 0 && (
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="w-4 h-4 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Promotions</span>
                                                </div>
                                                <p className="font-bold text-white text-sm">{member.totalPromotions} Belt Promotion{member.totalPromotions > 1 ? 's' : ''}</p>
                                            </div>
                                        )}

                                        {/* Last Promotion */}
                                        {member.lastPromotion && (
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Award className="w-4 h-4 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Promotion</span>
                                                </div>
                                                <p className="font-bold text-white text-sm">{member.lastPromotion.newBelt} Belt</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(member.lastPromotion.promotionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-3 bg-white/3 border-t border-white/5 text-center">
                                    <p className="text-[10px] text-gray-600">
                                        Verified by Kyokushin Karate Foundation of India verification system
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                )}

                {/* How it works */}
                {!searched && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mt-16"
                    >
                        <h3 className="text-lg font-bold text-gray-300 mb-6">How Verification Works</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: <Search className="w-6 h-6" />, title: 'Enter ID', desc: 'Input the membership number from the member\'s card or QR code' },
                                { icon: <Shield className="w-6 h-6" />, title: 'Instant Check', desc: 'Our system verifies the membership against our database' },
                                { icon: <CheckCircle className="w-6 h-6" />, title: 'View Status', desc: 'See belt rank, membership status, and dojo information' },
                            ].map((step, i) => (
                                <div key={i} className="p-5 bg-white/3 rounded-xl border border-white/5">
                                    <div className="text-red-500 mb-3 flex justify-center">{step.icon}</div>
                                    <h4 className="font-bold text-white text-sm mb-1">{step.title}</h4>
                                    <p className="text-xs text-gray-500">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
