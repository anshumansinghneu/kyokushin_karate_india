'use client';

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Download, Share2, Flame, Crown, Star, Gem } from "lucide-react";
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
        experienceYears?: number;
        experienceMonths?: number;
        dojo?: { name: string; city?: string } | null;
    };
    showDownload?: boolean;
}

// Card tier system based on belt rank — like elite credit cards
type CardTier = 'standard' | 'elite' | 'platinum' | 'diamond' | 'legend';

function getCardTier(belt: string): { tier: CardTier; label: string; icon: typeof Star } {
    if (belt.includes('7th') || belt.includes('8th') || belt.includes('9th') || belt.includes('10th'))
        return { tier: 'legend', label: 'LEGEND', icon: Crown };
    if (belt.includes('5th') || belt.includes('6th'))
        return { tier: 'diamond', label: 'DIAMOND', icon: Gem };
    if (belt.includes('3rd') || belt.includes('4th'))
        return { tier: 'platinum', label: 'PLATINUM', icon: Star };
    if (belt.includes('1st') || belt.includes('2nd') || belt === 'Brown')
        return { tier: 'elite', label: 'ELITE', icon: Star };
    return { tier: 'standard', label: 'MEMBER', icon: Star };
}

const TIER_THEMES: Record<CardTier, {
    bg: string; accent: string; accentRgb: string; glow: string;
    border: string; shimmer: string; textGradient: string; chipBg: string;
}> = {
    standard: {
        bg: 'from-zinc-950 via-zinc-900 to-zinc-950',
        accent: '#a1a1aa', accentRgb: '161,161,170',
        glow: 'rgba(161,161,170,0.15)',
        border: 'border-white/[0.08]',
        shimmer: 'from-transparent via-white/[0.03] to-transparent',
        textGradient: 'from-zinc-200 to-zinc-400',
        chipBg: 'from-zinc-700 to-zinc-800',
    },
    elite: {
        bg: 'from-zinc-950 via-zinc-900 to-zinc-950',
        accent: '#dc2626', accentRgb: '220,38,38',
        glow: 'rgba(220,38,38,0.2)',
        border: 'border-red-500/20',
        shimmer: 'from-transparent via-red-500/[0.04] to-transparent',
        textGradient: 'from-red-300 to-red-500',
        chipBg: 'from-red-900 to-red-950',
    },
    platinum: {
        bg: 'from-[#0c0c12] via-[#14141f] to-[#0c0c12]',
        accent: '#a8b4d4', accentRgb: '168,180,212',
        glow: 'rgba(168,180,212,0.25)',
        border: 'border-blue-200/15',
        shimmer: 'from-transparent via-blue-100/[0.06] to-transparent',
        textGradient: 'from-blue-100 via-slate-200 to-blue-300',
        chipBg: 'from-slate-600 to-slate-800',
    },
    diamond: {
        bg: 'from-[#0a0a0f] via-[#111118] to-[#0a0a0f]',
        accent: '#c4b5fd', accentRgb: '196,181,253',
        glow: 'rgba(196,181,253,0.3)',
        border: 'border-violet-300/20',
        shimmer: 'from-transparent via-violet-200/[0.08] to-transparent',
        textGradient: 'from-violet-200 via-white to-violet-300',
        chipBg: 'from-violet-800 to-violet-950',
    },
    legend: {
        bg: 'from-[#0f0b04] via-[#1a1408] to-[#0f0b04]',
        accent: '#fbbf24', accentRgb: '251,191,36',
        glow: 'rgba(251,191,36,0.35)',
        border: 'border-yellow-400/20',
        shimmer: 'from-transparent via-yellow-300/[0.1] to-transparent',
        textGradient: 'from-yellow-200 via-amber-100 to-yellow-400',
        chipBg: 'from-yellow-700 to-amber-900',
    },
};

const BELT_COLORS: Record<string, string> = {
    White: '#e5e5e5', Orange: '#f97316', Blue: '#3b82f6',
    Yellow: '#eab308', Green: '#22c55e', Brown: '#92400e',
};

const ROLE_TITLES: Record<string, string> = {
    ADMIN: 'SHIHAN',
    INSTRUCTOR: 'SENSEI',
    STUDENT: 'KARATEKA',
};

function calculateExperience(user?: { experienceYears?: number; experienceMonths?: number; membershipStartDate?: string; createdAt?: string }) {
    if (user?.experienceYears || user?.experienceMonths) {
        const years = user.experienceYears || 0;
        const months = user.experienceMonths || 0;
        if (years > 0 && months > 0) return { years, months, display: `${years}y ${months}m` };
        if (years > 0) return { years, months: 0, display: `${years} yr${years > 1 ? 's' : ''}` };
        return { years: 0, months, display: months > 0 ? `${months} mo` : 'New' };
    }
    const date = user?.membershipStartDate || user?.createdAt;
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
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const belt = user?.currentBeltRank || 'White';
    const beltBase = belt.startsWith('Black') ? 'Black' : belt;
    const beltColor = BELT_COLORS[beltBase] || '#dc2626';
    const { tier, label: tierLabel, icon: TierIcon } = getCardTier(belt);
    const theme = TIER_THEMES[tier];
    const roleTitle = ROLE_TITLES[user?.role || 'STUDENT'] || 'KARATEKA';
    const isBlack = belt.startsWith('Black');
    const isPremium = tier !== 'standard';

    const experience = useMemo(
        () => calculateExperience(user),
        [user?.experienceYears, user?.experienceMonths, user?.membershipStartDate, user?.createdAt]
    );

    const verifyUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/verify/${user?.membershipNumber || ''}`
        : '';

    const validThru = user?.membershipEndDate
        ? new Date(user.membershipEndDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
        : '--/--';

    const memberSince = user?.membershipStartDate
        ? new Date(user.membershipStartDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '--';

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            const [{ jsPDF }, QRCode] = await Promise.all([
                import('jspdf'),
                import('qrcode'),
            ]);

            const W = 160, H = 100;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] });

            const pdfTier = getCardTier(belt);
            const pdfRoleTitle = ROLE_TITLES[user?.role || 'STUDENT'] || 'KARATEKA';
            const pdfExperience = calculateExperience(user);
            const pdfValidThru = user?.membershipEndDate
                ? new Date(user.membershipEndDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
                : user?.membershipStatus === 'ACTIVE' ? 'Active' : user?.membershipStatus || '--';
            const pdfMemberSince = user?.membershipStartDate
                ? new Date(user.membershipStartDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : '--';

            // Tier-specific PDF theme colors
            const pdfColors: Record<CardTier, { accent: [number, number, number]; bg: [number, number, number]; bg2: [number, number, number] }> = {
                standard:  { accent: [161, 161, 170], bg: [12, 12, 12], bg2: [18, 18, 18] },
                elite:     { accent: [220, 38, 38],    bg: [12, 12, 12], bg2: [18, 18, 18] },
                platinum:  { accent: [168, 180, 212],  bg: [12, 12, 18], bg2: [20, 20, 31] },
                diamond:   { accent: [196, 181, 253],  bg: [10, 10, 15], bg2: [17, 17, 24] },
                legend:    { accent: [251, 191, 36],   bg: [15, 11, 4],  bg2: [26, 20, 8] },
            };
            const pc = pdfColors[pdfTier.tier];

            const loadImg = (src: string): Promise<string> =>
                new Promise((resolve, reject) => {
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        const c = document.createElement('canvas');
                        c.width = img.naturalWidth; c.height = img.naturalHeight;
                        c.getContext('2d')!.drawImage(img, 0, 0);
                        resolve(c.toDataURL('image/png'));
                    };
                    img.onerror = reject;
                    img.src = src;
                });

            const qrUrl = verifyUrl || `${window.location.origin}/verify/${user?.membershipNumber || ''}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                width: 300, margin: 1,
                color: { dark: '#0a0a0a', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            });

            let logoDataUrl: string | null = null;
            try { logoDataUrl = await loadImg('/kkfi-logo.avif'); } catch {}

            // === Background ===
            doc.setFillColor(pc.bg[0], pc.bg[1], pc.bg[2]);
            doc.rect(0, 0, W, H, 'F');

            // Header strip
            doc.setFillColor(pc.bg2[0], pc.bg2[1], pc.bg2[2]);
            doc.rect(0, 0, W, 26, 'F');

            // Top accent line
            doc.setFillColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.rect(0, 0, W, 0.8, 'F');

            // Corner glows
            doc.setFillColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.setGState(doc.GState({ opacity: 0.06 }));
            doc.circle(W - 5, 5, 35, 'F');
            doc.circle(5, H - 5, 40, 'F');
            doc.setGState(doc.GState({ opacity: 1 }));

            // === Logo ===
            const logoSize = 13;
            if (logoDataUrl) {
                doc.setFillColor(0, 0, 0);
                doc.roundedRect(7, 4.5, logoSize + 3, logoSize + 3, 2.5, 2.5, 'F');
                doc.setDrawColor(pc.accent[0], pc.accent[1], pc.accent[2]);
                doc.setGState(doc.GState({ opacity: 0.15 }));
                doc.roundedRect(7, 4.5, logoSize + 3, logoSize + 3, 2.5, 2.5, 'S');
                doc.setGState(doc.GState({ opacity: 1 }));
                doc.addImage(logoDataUrl, 'PNG', 8.5, 6, logoSize, logoSize);
            }

            // Organization name
            const textX = logoDataUrl ? 25 : 8;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text('KYOKUSHIN KARATE', textX, 11);
            doc.setFontSize(5);
            doc.setTextColor(255, 153, 51);
            doc.text('FOUNDATION', textX, 15);
            const foW = doc.getTextWidth('FOUNDATION ');
            doc.setTextColor(200, 200, 200);
            doc.text('OF', textX + foW, 15);
            const ofW = doc.getTextWidth('OF ');
            doc.setTextColor(19, 136, 8);
            doc.text('INDIA', textX + foW + ofW, 15);

            // Tier label
            doc.setFontSize(4);
            doc.setTextColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.text(pdfTier.label, textX, 19.5);

            // ID badge (top right)
            const memNum = user?.membershipNumber || 'PENDING';
            const badgeW = Math.max(doc.getTextWidth(memNum) * 1.1 + 10, 34);
            const badgeX = W - badgeW - 7;
            doc.setFillColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.setGState(doc.GState({ opacity: 0.06 }));
            doc.roundedRect(badgeX, 4, badgeW, 17, 2, 2, 'F');
            doc.setGState(doc.GState({ opacity: 0.12 }));
            doc.setDrawColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.roundedRect(badgeX, 4, badgeW, 17, 2, 2, 'S');
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.setFontSize(3.5);
            doc.setTextColor(128, 128, 128);
            doc.text('ID', badgeX + 4, 9);
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(memNum, badgeX + 4, 16.5);

            // === Role title ===
            const roleY = 34;
            doc.setFillColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.circle(9, roleY - 0.8, 0.9, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(4.5);
            doc.setTextColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.text(pdfRoleTitle, 12, roleY);

            // === Member name ===
            doc.setFont('helvetica', 'bold');
            const cleanName = (user?.name || 'Member').replace(new RegExp(`^${pdfRoleTitle}\\s+`, 'i'), '').toUpperCase();
            const displayName = pdfRoleTitle !== 'KARATEKA' ? `${pdfRoleTitle} ${cleanName}` : cleanName;
            let nameFontSize = 17;
            doc.setFontSize(nameFontSize);
            while (doc.getTextWidth(displayName) > W - 16 && nameFontSize > 10) {
                nameFontSize -= 0.5;
                doc.setFontSize(nameFontSize);
            }
            doc.setTextColor(255, 255, 255);
            doc.text(displayName, 8, roleY + 10);

            // === Member since + belt rank line ===
            const midY = roleY + 17;
            doc.setFontSize(4);
            doc.setTextColor(120, 120, 120);
            doc.text(`MEMBER SINCE ${pdfMemberSince.toUpperCase()}`, 8, midY);
            doc.text(`BELT: ${belt.toUpperCase()}`, W / 2, midY);

            // Divider line
            doc.setDrawColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.setGState(doc.GState({ opacity: 0.15 }));
            doc.setLineWidth(0.3);
            doc.line(8, midY + 3, W - 8, midY + 3);
            doc.setGState(doc.GState({ opacity: 1 }));

            // === Bottom stats ===
            const statsY = H - 26;
            const statsH = 15;
            const gap = 2;
            const qrSize = 19;
            const availW = W - 16 - qrSize - 8;
            const boxW = (availW - gap * 3) / 4;

            const stats = [
                { label: 'RANK', value: belt },
                { label: 'DOJO', value: user?.dojo?.name || 'HQ' },
                { label: 'EXP', value: pdfExperience.display },
                { label: 'VALID', value: pdfValidThru },
            ];

            stats.forEach((stat, i) => {
                const bx = 8 + i * (boxW + gap);
                // Box background
                doc.setFillColor(pc.accent[0], pc.accent[1], pc.accent[2]);
                doc.setGState(doc.GState({ opacity: 0.04 }));
                doc.roundedRect(bx, statsY, boxW, statsH, 1.5, 1.5, 'F');
                doc.setGState(doc.GState({ opacity: 0.08 }));
                doc.setDrawColor(pc.accent[0], pc.accent[1], pc.accent[2]);
                doc.roundedRect(bx, statsY, boxW, statsH, 1.5, 1.5, 'S');
                doc.setGState(doc.GState({ opacity: 1 }));

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(3.2);
                doc.setTextColor(100, 100, 110);
                doc.text(stat.label, bx + 3, statsY + 4.5);

                doc.setFontSize(5.5);
                doc.setTextColor(255, 255, 255);
                let val = stat.value;
                while (doc.getTextWidth(val) > boxW - 6 && val.length > 3) val = val.slice(0, -1);
                if (val !== stat.value) val += '…';
                doc.text(val, bx + 3, statsY + 11);
            });

            // QR code
            const qrX = W - qrSize - 7;
            const qrY = statsY - 0.5;
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 2, 2, 'F');
            doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            // Bottom accent line
            doc.setFillColor(pc.accent[0], pc.accent[1], pc.accent[2]);
            doc.rect(0, H - 0.8, W, 0.8, 'F');

            doc.save(`KKFI_Card_${user?.membershipNumber || 'member'}.pdf`);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setIsDownloading(false);
        }
    }, [user, verifyUrl, belt]);

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
                        className={`relative rounded-2xl overflow-hidden ${theme.border} border`}
                        style={{
                            aspectRatio: '1.6 / 1',
                            boxShadow: `0 30px 80px -20px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.06)`,
                        }}
                    >
                        {/* ── Background ── */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`} />

                        {/* Noise texture */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                            }}
                        />

                        {/* Shimmer sweep — animated on premium */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-r ${theme.shimmer} ${isPremium ? 'animate-shimmer' : ''}`}
                            style={{ backgroundSize: '200% 100%' }}
                        />

                        {/* Corner glows */}
                        <div className="absolute top-0 right-0 w-56 h-56 opacity-[0.12]"
                            style={{ background: `radial-gradient(circle at top right, ${theme.accent}, transparent 70%)` }} />
                        <div className="absolute bottom-0 left-0 w-64 h-52 opacity-[0.08]"
                            style={{ background: `radial-gradient(circle at bottom left, ${theme.accent}, transparent 70%)` }} />

                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{ background: `linear-gradient(90deg, ${theme.accent}00 0%, ${theme.accent} 50%, ${theme.accent}00 100%)` }} />

                        {/* ── Content ── */}
                        <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between z-10">

                            {/* Header row */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                    {/* Logo with tier-colored glow */}
                                    <div className="relative">
                                        <div className="absolute -inset-1 rounded-xl blur-md opacity-30"
                                            style={{ background: theme.accent }} />
                                        <div className={`relative bg-black/80 p-1.5 sm:p-2 rounded-xl border`}
                                            style={{ borderColor: `${theme.accent}30` }}>
                                            <Image src="/kkfi-logo.avif" alt="KKFI" width={32} height={32}
                                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-base font-black tracking-[0.02em] text-white leading-none">KYOKUSHIN KARATE</h3>
                                        <p className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] mt-0.5">
                                            <span className="bg-gradient-to-r from-orange-400 via-white to-green-400 bg-clip-text text-transparent">FOUNDATION OF INDIA</span>
                                        </p>
                                        {/* Tier badge */}
                                        <div className="flex items-center gap-1 mt-1">
                                            <TierIcon className="w-2.5 h-2.5" style={{ color: theme.accent }} />
                                            <span className={`text-[7px] sm:text-[8px] font-black tracking-[0.25em] bg-gradient-to-r ${theme.textGradient} bg-clip-text text-transparent`}>
                                                {tierLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ID badge */}
                                <div className="backdrop-blur-sm px-2.5 py-1.5 rounded-lg border"
                                    style={{
                                        background: `rgba(${theme.accentRgb}, 0.06)`,
                                        borderColor: `rgba(${theme.accentRgb}, 0.12)`,
                                    }}>
                                    <p className="text-[7px] sm:text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-0.5">ID</p>
                                    <p className="text-[10px] sm:text-xs font-black tracking-wider text-white">
                                        {user?.membershipNumber || (user?.membershipStatus === 'ACTIVE' ? 'GENERATING…' : 'PENDING')}
                                    </p>
                                </div>
                            </div>

                            {/* Role + Name */}
                            <div className="flex-1 flex flex-col justify-center min-h-0 py-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />
                                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em]"
                                        style={{ color: theme.accent }}>
                                        {roleTitle}
                                    </span>
                                </div>
                                <h2 className="text-base sm:text-2xl font-black text-white uppercase tracking-tight leading-[1.1]">
                                    {roleTitle !== 'KARATEKA' ? `${roleTitle} ` : ''}{user?.name?.replace(new RegExp(`^${roleTitle}\\s+`, 'i'), '')}
                                </h2>
                                {/* Member since line */}
                                <p className="text-[7px] sm:text-[8px] text-gray-500 tracking-[0.1em] mt-1.5 font-medium">
                                    MEMBER SINCE {memberSince.toUpperCase()} &nbsp;•&nbsp; {belt.toUpperCase()}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full mb-2 sm:mb-3"
                                style={{ background: `linear-gradient(90deg, transparent, rgba(${theme.accentRgb}, 0.2), transparent)` }} />

                            {/* Bottom stats row */}
                            <div className="flex items-end justify-between gap-2">
                                <div className="flex gap-1.5 sm:gap-2 flex-1 min-w-0">
                                    {[
                                        { label: 'Rank', value: belt, dot: true },
                                        { label: 'Dojo', value: user?.dojo?.name || 'HQ' },
                                        { label: 'Exp', value: experience.display, icon: true },
                                        { label: 'Valid', value: validThru },
                                    ].map((item, i) => (
                                        <div key={i} className="flex-1 min-w-0 rounded-lg p-1.5 sm:p-2 border"
                                            style={{
                                                background: `rgba(${theme.accentRgb}, 0.04)`,
                                                borderColor: `rgba(${theme.accentRgb}, 0.08)`,
                                            }}>
                                            <p className="text-[6px] sm:text-[7px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-0.5">{item.label}</p>
                                            <div className="flex items-center gap-1">
                                                {item.dot && (
                                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                                                        style={{ background: isBlack ? theme.accent : beltColor }} />
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
                        <div className="absolute bottom-0 left-0 right-0 h-[3px]"
                            style={{ background: `linear-gradient(90deg, ${theme.accent}00, ${theme.accent}, ${theme.accent}00)` }} />
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
                        className="flex items-center gap-2 px-5 py-2.5 border rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: `rgba(${theme.accentRgb}, 0.08)`,
                            borderColor: `rgba(${theme.accentRgb}, 0.15)`,
                        }}
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Saving...' : 'Download Card'}
                    </button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: `rgba(${theme.accentRgb}, 0.08)`,
                                borderColor: `rgba(${theme.accentRgb}, 0.15)`,
                            }}
                        >
                            <Share2 className="w-4 h-4" />Share
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
