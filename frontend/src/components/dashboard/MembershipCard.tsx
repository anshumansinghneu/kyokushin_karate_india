'use client';

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Download, Share2, Flame } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

interface MembershipCardProps {
    user: {
        name: string;
        membershipNumber?: string;
        membershipStatus?: string;
        membershipStartDate?: string;
        membershipEndDate?: string;
        currentBeltRank?: string;
        profilePhotoUrl?: string;
        role?: string;
        createdAt?: string;
        dojo?: { name: string; city?: string } | null;
    };
    showDownload?: boolean;
}

const BELT_THEMES: Record<string, { accent: string; glow: string }> = {
    White:  { accent: '#e5e5e5', glow: 'rgba(255,255,255,0.25)' },
    Orange: { accent: '#f97316', glow: 'rgba(249,115,22,0.35)' },
    Blue:   { accent: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
    Yellow: { accent: '#eab308', glow: 'rgba(234,179,8,0.35)' },
    Green:  { accent: '#22c55e', glow: 'rgba(34,197,94,0.35)' },
    Brown:  { accent: '#92400e', glow: 'rgba(146,64,14,0.35)' },
    Black:  { accent: '#dc2626', glow: 'rgba(220,38,38,0.35)' },
};

const ROLE_TITLES: Record<string, string> = {
    ADMIN: 'SHIHAN',
    INSTRUCTOR: 'SENSEI',
    STUDENT: 'KARATEKA',
};

function calculateExperience(startDate?: string, createdAt?: string) {
    const date = startDate || createdAt;
    if (!date) return { years: 0, months: 0, display: 'New' };
    const ms = Date.now() - new Date(date).getTime();
    const totalMonths = Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years > 0) return { years, months, display: `${years}+ yr${years > 1 ? 's' : ''}` };
    return { years: 0, months, display: months > 0 ? `${months} mo` : 'New' };
}

export default function MembershipCard({ user, showDownload = true }: MembershipCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const belt = user?.currentBeltRank || 'White';
    const theme = BELT_THEMES[belt] || BELT_THEMES.White;
    const roleTitle = ROLE_TITLES[user?.role || 'STUDENT'] || 'KARATEKA';
    const experience = useMemo(
        () => calculateExperience(user?.membershipStartDate, user?.createdAt),
        [user?.membershipStartDate, user?.createdAt]
    );

    const verifyUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/verify/${user?.membershipNumber || ''}`
        : '';

    const validThru = user?.membershipEndDate
        ? new Date(user.membershipEndDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
        : '--/--';

    const handleDownload = useCallback(async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 3,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `KKFI-${user?.membershipNumber || 'Card'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setIsDownloading(false);
        }
    }, [user?.membershipNumber]);

    const handleShare = useCallback(async () => {
        if (navigator.share && verifyUrl) {
            await navigator.share({
                title: `KKFI Membership - ${user?.name}`,
                text: `Verify my KKFI membership: ${user?.membershipNumber}`,
                url: verifyUrl,
            }).catch(() => { });
        }
    }, [user?.name, user?.membershipNumber, verifyUrl]);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div style={{ perspective: '1200px' }}>
                <motion.div
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    initial={{ opacity: 0, scale: 0.92, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
                    className="cursor-pointer group"
                >
                    <div
                        ref={cardRef}
                        className="relative aspect-[1.6/1] rounded-2xl overflow-hidden"
                        style={{ boxShadow: `0 30px 80px -20px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.08)` }}
                    >
                        {/* ── Background layers ── */}
                        <div className="absolute inset-0 bg-[#080808]" />
                        {/* Noise texture */}
                        <div
                            className="absolute inset-0 opacity-[0.025]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                            }}
                        />
                        {/* Diagonal light streak */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
                        {/* Corner radial glows */}
                        <div
                            className="absolute top-0 right-0 w-48 h-48 opacity-15"
                            style={{ background: `radial-gradient(circle at top right, ${theme.accent}, transparent 70%)` }}
                        />
                        <div
                            className="absolute bottom-0 left-0 w-64 h-48 opacity-10"
                            style={{ background: `radial-gradient(circle at bottom left, ${theme.accent}, transparent 70%)` }}
                        />

                        {/* Top accent line */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{ background: `linear-gradient(90deg, transparent 5%, ${theme.accent}, transparent 95%)` }}
                        />

                        {/* ── Card content ── */}
                        <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between z-10">
                            {/* Header row */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                        <div className="absolute -inset-1 rounded-xl opacity-30 blur-md" style={{ background: theme.accent }} />
                                        <div className="relative bg-black/80 p-1.5 sm:p-2 rounded-xl border border-white/10">
                                            <Image src="/kkfi-logo.avif" alt="KKFI" width={32} height={32} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-base font-black tracking-[0.02em] text-white leading-none">KYOKUSHIN KARATE</h3>
                                        <p className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] mt-0.5">
                                            <span className="bg-gradient-to-r from-orange-400 via-white to-green-400 bg-clip-text text-transparent">FOUNDATION OF INDIA</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.05] backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/[0.08]">
                                    <p className="text-[7px] sm:text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-0.5">ID</p>
                                    <p className="text-[10px] sm:text-xs font-black tracking-wider text-white">{user?.membershipNumber || "PENDING"}</p>
                                </div>
                            </div>

                            {/* Name + role */}
                            <div className="my-auto pt-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />
                                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
                                        {roleTitle}
                                    </span>
                                </div>
                                <h2 className="text-lg sm:text-[28px] font-black text-white uppercase tracking-tight leading-[1.1]">
                                    {user?.name}
                                </h2>
                            </div>

                            {/* Bottom stats row */}
                            <div className="flex items-end justify-between gap-2">
                                <div className="flex gap-1.5 sm:gap-2 flex-1 min-w-0">
                                    {[
                                        { label: 'Rank', value: belt, dot: true },
                                        { label: 'Dojo', value: user?.dojo?.name || 'HQ' },
                                        { label: 'Exp', value: experience.display, icon: true },
                                        { label: 'Valid', value: validThru },
                                    ].map((item, i) => (
                                        <div key={i} className="flex-1 min-w-0 bg-white/[0.04] rounded-lg p-1.5 sm:p-2 border border-white/[0.05]">
                                            <p className="text-[6px] sm:text-[7px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-0.5">{item.label}</p>
                                            <div className="flex items-center gap-1">
                                                {item.dot && (
                                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0" style={{ background: theme.accent }} />
                                                )}
                                                {item.icon && (
                                                    <Flame className="w-2.5 h-2.5 flex-shrink-0" style={{ color: theme.accent }} />
                                                )}
                                                <span className="text-[9px] sm:text-[11px] font-black text-white truncate">{item.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* QR Code */}
                                <div className="flex-shrink-0">
                                    <div className="bg-white p-1 sm:p-1.5 rounded-lg shadow-xl ring-1 ring-black/10">
                                        {user?.membershipNumber ? (
                                            <QRCodeSVG
                                                value={verifyUrl || user.membershipNumber}
                                                size={48}
                                                bgColor="#ffffff"
                                                fgColor="#0a0a0a"
                                                level="M"
                                                includeMargin={false}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-[7px] font-bold">PENDING</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom accent line */}
                        <div
                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}55, transparent)` }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Action buttons */}
            {showDownload && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3 justify-center mt-5"
                >
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Saving...' : 'Download Card'}
                    </button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Share2 className="w-4 h-4" />Share
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
