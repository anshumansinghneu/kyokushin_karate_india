'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Shield, Fingerprint, Database, Eye } from 'lucide-react';
import Image from 'next/image';

const RECENT_FORMATS = [
    'KKI-2025-MUM-00001',
    'KKI-2025-DEL-00042',
    'KKI-2026-BLR-00103',
];

export default function VerifyIndexPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [typedExample, setTypedExample] = useState('');

    // Typing animation for placeholder
    useEffect(() => {
        const example = 'KKI-2025-MUM-00001';
        let i = 0;
        const interval = setInterval(() => {
            setTypedExample(example.slice(0, i + 1));
            i++;
            if (i >= example.length) clearInterval(interval);
        }, 80);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/verify/${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#060606] text-white relative">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-950/[0.12] rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            {/* Top accent line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent" />

            {/* Main content */}
            <div className="relative z-10 max-w-xl mx-auto px-5 pt-16 sm:pt-24 pb-20">

                {/* Logo + Title block */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-6 relative">
                        <Image src="/kkfi-logo.avif" alt="KKFI" width={36} height={36} className="w-9 h-9" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#060606] border border-white/[0.08] flex items-center justify-center">
                            <Shield className="w-2.5 h-2.5 text-red-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                        Membership Verification
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-[15px] max-w-sm mx-auto leading-relaxed">
                        Confirm the authenticity of any KKFI membership by entering an ID below.
                    </p>
                </motion.div>

                {/* Search */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-16"
                >
                    <div className={`flex items-center bg-white/[0.03] rounded-xl border transition-all duration-300 ${isFocused ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.06)]' : 'border-white/[0.06]'}`}>
                        <div className="pl-4 text-gray-600">
                            <Search className="w-[18px] h-[18px]" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={query ? '' : typedExample || 'KKI-2025-MUM-00001'}
                            className="flex-1 px-3 py-4 bg-transparent text-white text-[15px] placeholder-gray-600 focus:outline-none font-mono"
                            autoFocus
                        />
                        <div className="pr-1.5">
                            <button
                                type="submit"
                                disabled={!query.trim()}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 disabled:bg-white/[0.05] disabled:text-gray-600 transition-all"
                            >
                                Verify
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 px-1">
                        <p className="text-[11px] text-gray-600">
                            Public lookup — no account needed
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-600">
                            <Shield className="w-3 h-3" />
                            Secure
                        </div>
                    </div>
                </motion.form>

                {/* How it works – card style */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-white/[0.04]" />
                        <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-[0.2em]">How it works</span>
                        <div className="h-px flex-1 bg-white/[0.04]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { num: '01', icon: Fingerprint, title: 'Enter ID', desc: 'Type the membership number from their card or certificate' },
                            { num: '02', icon: Database, title: 'We verify', desc: 'Instantly checked against the official KKFI database' },
                            { num: '03', icon: Eye, title: 'View details', desc: 'Belt rank, dojo, experience, and promotion history' },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors group"
                            >
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-red-500/[0.08] flex items-center justify-center">
                                        <step.icon className="w-3.5 h-3.5 text-red-400/80" />
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-700">{step.num}</span>
                                </div>
                                <h3 className="text-[13px] font-semibold text-gray-200 mb-1">{step.title}</h3>
                                <p className="text-[12px] text-gray-600 leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Example format hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]"
                >
                    <p className="text-[10px] text-gray-600 mb-3 font-semibold uppercase tracking-wider">Example IDs</p>
                    <div className="flex flex-wrap gap-2">
                        {RECENT_FORMATS.map((fmt, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setQuery(fmt)}
                                className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs font-mono text-gray-500 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.05] transition-all cursor-pointer"
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-700 mt-3 font-mono">
                        Pattern: KKI-YEAR-CITY-NUMBER
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
