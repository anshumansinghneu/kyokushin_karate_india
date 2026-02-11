'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionBarProps {
    user: {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
        dob?: string;
        height?: number | string;
        weight?: number | string;
        profilePhotoUrl?: string;
        fatherName?: string;
        dojo?: any;
        currentBeltRank?: string;
    };
}

interface CompletionField {
    key: string;
    label: string;
    filled: boolean;
}

export default function ProfileCompletionBar({ user }: ProfileCompletionBarProps) {
    const { percentage, fields, missingFields } = useMemo(() => {
        const checks: CompletionField[] = [
            { key: 'name', label: 'Full Name', filled: !!user?.name },
            { key: 'email', label: 'Email', filled: !!user?.email },
            { key: 'phone', label: 'Phone', filled: !!user?.phone },
            { key: 'city', label: 'City', filled: !!user?.city },
            { key: 'state', label: 'State', filled: !!user?.state },
            { key: 'dob', label: 'Date of Birth', filled: !!user?.dob },
            { key: 'height', label: 'Height', filled: !!user?.height },
            { key: 'weight', label: 'Weight', filled: !!user?.weight },
            { key: 'profilePhotoUrl', label: 'Profile Photo', filled: !!user?.profilePhotoUrl },
            { key: 'dojo', label: 'Dojo', filled: !!user?.dojo },
        ];
        const filled = checks.filter(c => c.filled).length;
        return {
            percentage: Math.round((filled / checks.length) * 100),
            fields: checks,
            missingFields: checks.filter(c => !c.filled),
        };
    }, [user]);

    if (percentage === 100) return null;

    const barColor = percentage >= 80 ? 'from-green-500 to-emerald-500' :
                     percentage >= 50 ? 'from-yellow-500 to-orange-500' :
                     'from-red-500 to-red-600';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-5"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <h4 className="text-sm font-bold text-white">Profile Completion</h4>
                </div>
                <span className="text-sm font-black text-white">{percentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                />
            </div>

            {/* Missing fields */}
            {missingFields.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {missingFields.slice(0, 3).map(f => (
                        <span key={f.key} className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                            + {f.label}
                        </span>
                    ))}
                    {missingFields.length > 3 && (
                        <span className="text-[10px] font-bold text-gray-500 px-2 py-1">
                            +{missingFields.length - 3} more
                        </span>
                    )}
                </div>
            )}

            <Link
                href="/profile"
                className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
            >
                Complete your profile <ChevronRight className="w-3 h-3" />
            </Link>
        </motion.div>
    );
}
