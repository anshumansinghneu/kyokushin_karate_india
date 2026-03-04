'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Search, Award, Calendar, MapPin, AlertTriangle, Flame, TrendingUp, ArrowRight, Lock, Fingerprint, BadgeCheck } from 'lucide-react';
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

const BELT_COLORS: Record<string, { bg: string; ring: string; dot: string }> = {
    White: { bg: 'bg-white', ring: 'ring-gray-300', dot: 'bg-white' },
    Orange: { bg: 'bg-orange-500', ring: 'ring-orange-500/30', dot: 'bg-orange-500' },
    Blue: { bg: 'bg-blue-500', ring: 'ring-blue-500/30', dot: 'bg-blue-500' },
    Yellow: { bg: 'bg-yellow-400', ring: 'ring-yellow-400/30', dot: 'bg-yellow-400' },
    Green: { bg: 'bg-green-500', ring: 'ring-green-500/30', dot: 'bg-green-500' },
    Brown: { bg: 'bg-amber-700', ring: 'ring-amber-700/30', dot: 'bg-amber-700' },
    Black: { bg: 'bg-gray-900', ring: 'ring-gray-500/30', dot: 'bg-gray-900 border border-gray-600' },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; text: string; bgColor: string; borderColor: string }> = {
    ACTIVE: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400', text: 'Active Member', bgColor: 'bg-emerald-500/[0.08]', borderColor: 'border-emerald-500/20' },
    EXPIRED: { icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-400', text: 'Membership Expired', bgColor: 'bg-amber-500/[0.08]', borderColor: 'border-amber-500/20' },
    PENDING: { icon: <Shield className="w-5 h-5" />, color: 'text-amber-400', text: 'Pending Verification', bgColor: 'bg-amber-500/[0.08]', borderColor: 'border-amber-500/20' },
    REJECTED: { icon: <XCircle className="w-5 h-5" />, color: 'text-red-400', text: 'Membership Rejected', bgColor: 'bg-red-500/[0.08]', borderColor: 'border-red-500/20' },
};

export default function VerifyPage() {
    const params = useParams();
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

    const statusCfg = member ? STATUS_CONFIG[member.membershipStatus] || STATUS_CONFIG.PENDING : null;
    const beltStyle = member ? BELT_COLORS[member.currentBeltRank] || BELT_COLORS.White : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
            </div>

            <div className="relative z-10">
                <div className="max-w-2xl mx-auto px-4 pt-14 pb-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Member Verification</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
                            Verify{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">Membership</span>
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Enter a KKFI membership number to verify credentials
                        </p>
                    </motion.div>

                    {/* Search Form */}
                    <motion.form
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onSubmit={handleSubmit}
                        className="mb-8"
                    >
                        <div className={`relative flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border transition-all duration-300 ${isFocused ? 'border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'border-white/[0.08]'}`}>
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder="e.g. KKI-2025-MUM-00001"
                                    className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !searchQuery.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Verify <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </motion.form>

                    {/* Loading */}
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-16 text-center"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">Verifying membership...</p>
                            <p className="text-xs text-gray-600 mt-1">Checking against secure database</p>
                        </motion.div>
                    )}

                    {/* Result */}
                    {searched && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {error ? (
                                <div className="rounded-2xl bg-white/[0.02] border border-red-500/20 overflow-hidden">
                                    <div className="p-8 text-center">
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/[0.1] border border-red-500/20 flex items-center justify-center">
                                            <XCircle className="w-7 h-7 text-red-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-2">Member Not Found</h2>
                                        <p className="text-sm text-gray-400 max-w-sm mx-auto">{error}</p>
                                        <p className="text-xs text-gray-600 mt-4">
                                            Double-check the membership number and try again
                                        </p>
                                    </div>
                                </div>
                            ) : member ? (
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                                    {/* Status Banner */}
                                    <div className={`px-6 py-4 ${statusCfg?.bgColor} border-b ${statusCfg?.borderColor}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={statusCfg?.color}>{statusCfg?.icon}</span>
                                                <div>
                                                    <h3 className={`font-bold text-sm ${statusCfg?.color}`}>{statusCfg?.text}</h3>
                                                    {member.membershipEndDate && (
                                                        <p className="text-[11px] text-gray-500">
                                                            Valid until {new Date(member.membershipEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                KKFI Verified
                                            </div>
                                        </div>
                                    </div>

                                    {/* Member Identity */}
                                    <div className="p-6">
                                        <div className="flex items-start gap-5">
                                            <div className="flex-shrink-0">
                                                {member.profilePhotoUrl ? (
                                                    <img
                                                        src={member.profilePhotoUrl}
                                                        alt={member.name}
                                                        className="w-[72px] h-[72px] rounded-2xl object-cover ring-2 ring-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-red-500/80 to-red-700/80 flex items-center justify-center text-2xl font-black text-white ring-2 ring-white/10">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-xl font-black text-white truncate">{member.name}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-semibold text-gray-400 bg-white/[0.05] px-2 py-0.5 rounded">
                                                        {member.role === 'INSTRUCTOR' ? 'Instructor' : member.role === 'ADMIN' ? 'Administrator' : 'Student'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-mono text-gray-600 mt-2 tracking-wide">{member.membershipNumber}</p>
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-3 mt-6">
                                            {/* Belt Rank */}
                                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Award className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Belt Rank</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-5 h-5 rounded-full ring-2 ${beltStyle?.bg} ${beltStyle?.ring}`} />
                                                    <span className="font-bold text-white text-sm">{member.currentBeltRank} Belt</span>
                                                </div>
                                            </div>

                                            {/* Dojo */}
                                            {member.dojo && (
                                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dojo</span>
                                                    </div>
                                                    <p className="font-bold text-white text-sm truncate">{member.dojo.name}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">{member.dojo.city}</p>
                                                </div>
                                            )}

                                            {/* Member Since */}
                                            {member.membershipStartDate && (
                                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Member Since</span>
                                                    </div>
                                                    <p className="font-bold text-white text-sm">
                                                        {new Date(member.membershipStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Experience */}
                                            {member.experience && (
                                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Experience</span>
                                                    </div>
                                                    <p className="font-bold text-white text-sm">{member.experience.display}</p>
                                                </div>
                                            )}

                                            {/* Total Promotions */}
                                            {typeof member.totalPromotions === 'number' && member.totalPromotions > 0 && (
                                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Promotions</span>
                                                    </div>
                                                    <p className="font-bold text-white text-sm">{member.totalPromotions} Belt Promotion{member.totalPromotions > 1 ? 's' : ''}</p>
                                                </div>
                                            )}

                                            {/* Last Promotion */}
                                            {member.lastPromotion && (
                                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Award className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Last Promotion</span>
                                                    </div>
                                                    <p className="font-bold text-white text-sm">{member.lastPromotion.newBelt} Belt</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {new Date(member.lastPromotion.promotionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.05] flex items-center justify-center gap-2">
                                        <Fingerprint className="w-3 h-3 text-gray-600" />
                                        <p className="text-[10px] text-gray-600 font-medium">
                                            Verified by Kyokushin Karate Foundation of India
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    )}

                    {/* How it works — only show when not searched */}
                    {!searched && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mt-12"
                        >
                            <h3 className="text-sm font-bold text-gray-400 mb-6">How Verification Works</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { icon: Search, title: 'Enter ID', desc: 'Input the membership number from the card or QR code', color: 'text-emerald-400' },
                                    { icon: Shield, title: 'Instant Check', desc: 'We verify credentials against the member database', color: 'text-cyan-400' },
                                    { icon: CheckCircle, title: 'View Status', desc: 'See belt rank, membership status, and dojo information', color: 'text-green-400' },
                                ].map((step, i) => (
                                    <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                        <div className={`${step.color} mb-3 flex justify-center`}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-white text-sm mb-1">{step.title}</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
