'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Search, CheckCircle, ArrowRight, Fingerprint, QrCode, Lock, BadgeCheck, Zap } from 'lucide-react';

export default function VerifyIndexPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/verify/${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-emerald-500/[0.03] to-transparent rounded-full blur-3xl" />
                <div className="absolute top-40 -left-32 w-64 h-64 bg-emerald-500/[0.04] rounded-full blur-3xl" />
                <div className="absolute top-60 -right-32 w-64 h-64 bg-cyan-500/[0.03] rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Official Verification Portal</span>
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tight">
                            Verify{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                                Membership
                            </span>
                        </h1>
                        <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-12">
                            Authenticate a KKFI member&apos;s belt rank, training status, and credentials instantly
                        </p>

                        {/* Search Bar */}
                        <motion.form
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            onSubmit={handleSubmit}
                            className="max-w-xl mx-auto"
                        >
                            <div className={`relative flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border transition-all duration-300 ${isFocused ? 'border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'border-white/[0.08]'}`}>
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder="Enter membership ID  e.g. KKI-2025-MUM-00001"
                                        className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!query.trim()}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
                                >
                                    Verify
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-3 flex items-center justify-center gap-1.5">
                                <Lock className="w-3 h-3" />
                                Secure, public verification — no login required
                            </p>
                        </motion.form>
                    </motion.div>
                </div>

                {/* How It Works */}
                <div className="max-w-3xl mx-auto px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-center text-lg font-bold text-gray-300 mb-8">How It Works</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: QrCode, title: 'Enter or Scan', desc: 'Type the membership number or scan the QR code from a member\'s card', color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400' },
                                { icon: Zap, title: 'Instant Check', desc: 'We verify credentials against our secure central member database in real-time', color: 'from-cyan-500/20 to-cyan-500/5', iconColor: 'text-cyan-400' },
                                { icon: BadgeCheck, title: 'View Results', desc: 'See belt rank, dojo affiliation, membership validity, and training history', color: 'from-green-500/20 to-green-500/5', iconColor: 'text-green-400' },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-4">
                                            <div className={`absolute inset-0 bg-gradient-to-b ${step.color} rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity`} />
                                            <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-b ${step.color} border border-white/[0.06] flex items-center justify-center`}>
                                                <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                                            </div>
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                {i + 1}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-white text-sm mb-1.5">{step.title}</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* What You Can Verify */}
                <div className="max-w-3xl mx-auto px-4 pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-white/[0.06] flex items-center justify-center">
                                <Fingerprint className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">What Gets Verified</h3>
                                <p className="text-xs text-gray-500">Information returned upon successful lookup</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                'Membership Status',
                                'Current Belt Rank',
                                'Dojo Affiliation',
                                'Training Experience',
                                'Belt Promotion History',
                                'Membership Validity',
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
