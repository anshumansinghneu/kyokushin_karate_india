'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Shield } from 'lucide-react';
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
        <div className="min-h-screen bg-[#080808] text-white">
            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />

            {/* Main content */}
            <div className="max-w-2xl mx-auto px-5 pt-16 sm:pt-24 pb-20">

                {/* Logo + Title block */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-white/[0.08] bg-white/[0.03] mb-6">
                        <Image src="/kkfi-logo.avif" alt="KKFI" width={36} height={36} className="w-9 h-9" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                        Membership Verification
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                        Confirm the authenticity of any KKFI membership by entering an ID below.
                    </p>
                </div>

                {/* Search */}
                <form onSubmit={handleSubmit} className="mb-16">
                    <div className={`flex items-center bg-[#111] rounded-xl border transition-colors duration-200 ${isFocused ? 'border-white/20' : 'border-white/[0.08]'}`}>
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
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 disabled:bg-white/[0.06] disabled:text-gray-600 transition-colors"
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
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[11px] text-gray-600 font-medium uppercase tracking-wider">How it works</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Steps — clean horizontal layout */}
                <div className="space-y-0">
                    {[
                        { num: '01', title: 'Enter the membership ID', desc: 'Found on the member\'s physical card or digital certificate issued by KKFI.' },
                        { num: '02', title: 'We check our records', desc: 'The ID is matched against the official KKFI membership database in real time.' },
                        { num: '03', title: 'View verified details', desc: 'Belt rank, dojo, membership status, training experience, and promotion history.' },
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex gap-5 py-5 border-b border-white/[0.04] last:border-0"
                        >
                            <span className="text-xs font-mono text-gray-600 pt-0.5 tabular-nums">{step.num}</span>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-200 mb-1">{step.title}</h3>
                                <p className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Example format hint */}
                <div className="mt-12 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-gray-500 mb-3 font-medium">Membership ID format</p>
                    <div className="flex flex-wrap gap-2">
                        {RECENT_FORMATS.map((fmt, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setQuery(fmt)}
                                className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-gray-400 hover:text-white hover:border-white/[0.12] transition-colors cursor-pointer"
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-3">
                        IDs follow the pattern <span className="font-mono text-gray-500">KKI-YEAR-CITY-NUMBER</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
