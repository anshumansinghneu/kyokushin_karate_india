'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Search, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function VerifyIndexPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/verify/${encodeURIComponent(query.trim())}`);
        }
    };

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

            <div className="max-w-2xl mx-auto px-4 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Verification Portal</span>
                    </div>
                    <h1 className="text-4xl font-black mb-3">Verify KKFI Membership</h1>
                    <p className="text-gray-400 mb-10">
                        Enter a KKFI membership number to verify a member&apos;s belt rank, status, and credentials
                    </p>

                    <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="e.g. KKI-2025-MUM-00001"
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all text-lg"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!query.trim()}
                            className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold transition-all"
                        >
                            Verify
                        </button>
                    </form>

                    {/* How it works */}
                    <div className="mt-20">
                        <h3 className="text-lg font-bold text-gray-300 mb-6">How It Works</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: <Search className="w-6 h-6" />, title: 'Enter ID', desc: 'Type or scan the membership number from a member\'s card' },
                                { icon: <Shield className="w-6 h-6" />, title: 'Instant Check', desc: 'We verify against our central member database' },
                                { icon: <CheckCircle className="w-6 h-6" />, title: 'See Results', desc: 'View belt rank, membership status, and dojo details' },
                            ].map((step, i) => (
                                <div key={i} className="p-5 bg-white/3 rounded-xl border border-white/5">
                                    <div className="text-red-500 mb-3 flex justify-center">{step.icon}</div>
                                    <h4 className="font-bold text-white text-sm mb-1">{step.title}</h4>
                                    <p className="text-xs text-gray-500">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
