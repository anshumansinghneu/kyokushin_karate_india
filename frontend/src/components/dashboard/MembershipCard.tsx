'use client';

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Download, Share2, Flame, Swords, Shield } from "lucide-react";
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

// Belt-based accent — aggressive red for black belts, belt color for others
const BELT_ACCENTS: Record<string, { color: string; rgb: string }> = {
    White:  { color: '#94a3b8', rgb: '148,163,184' },
    Orange: { color: '#f97316', rgb: '249,115,22' },
    Blue:   { color: '#3b82f6', rgb: '59,130,246' },
    Yellow: { color: '#eab308', rgb: '234,179,8' },
    Green:  { color: '#22c55e', rgb: '34,197,94' },
    Brown:  { color: '#a16207', rgb: '161,98,7' },
    Black:  { color: '#dc2626', rgb: '220,38,38' },
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
        if (years > 0) return { years, months: 0, display: `${years} yrs` };
        return { years: 0, months, display: months > 0 ? `${months} mo` : 'New' };
    }
    const date = user?.membershipStartDate || user?.createdAt;
    if (!date) return { years: 0, months: 0, display: 'New' };
    const ms = Date.now() - new Date(date).getTime();
    const totalMonths = Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years > 0) return { years, months, display: `${years}+ yrs` };
    return { years: 0, months, display: months > 0 ? `${months} mo` : 'New' };
}

export default function MembershipCard({ user, showDownload = true }: MembershipCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const belt = user?.currentBeltRank || 'White';
    const beltBase = belt.startsWith('Black') ? 'Black' : belt;
    const accent = BELT_ACCENTS[beltBase] || BELT_ACCENTS.Black;
    const roleTitle = ROLE_TITLES[user?.role || 'STUDENT'] || 'KARATEKA';
    const isBlack = belt.startsWith('Black');

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

    // Dan level for display (e.g. "5TH DAN" for the slash mark)
    const danMatch = belt.match(/(\d+)\w*\s*Dan/i);
    const danLevel = danMatch ? parseInt(danMatch[1]) : 0;

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            const [{ jsPDF }, QRCode] = await Promise.all([
                import('jspdf'),
                import('qrcode'),
            ]);

            const W = 160, H = 100;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] });

            const pdfRoleTitle = ROLE_TITLES[user?.role || 'STUDENT'] || 'KARATEKA';
            const pdfExperience = calculateExperience(user);
            const pdfValidThru = user?.membershipEndDate
                ? new Date(user.membershipEndDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
                : user?.membershipStatus === 'ACTIVE' ? 'Active' : user?.membershipStatus || '--';
            const pdfMemberSince = user?.membershipStartDate
                ? new Date(user.membershipStartDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : '--';

            const pdfAccent: [number, number, number] = isBlack
                ? [220, 38, 38]
                : (beltBase === 'White' ? [148, 163, 184] : [parseInt(accent.rgb.split(',')[0]), parseInt(accent.rgb.split(',')[1]), parseInt(accent.rgb.split(',')[2])]);

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
            doc.setFillColor(6, 6, 6);
            doc.rect(0, 0, W, H, 'F');

            // Darker header band
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, W, 26, 'F');

            // Top accent slash (aggressive angled line)
            doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.rect(0, 0, W, 0.7, 'F');

            // Diagonal slash across top-right (ninja slash mark)
            doc.setGState(doc.GState({ opacity: 0.04 }));
            doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.triangle(W - 60, 0, W, 0, W, 50, 'F');
            doc.setGState(doc.GState({ opacity: 1 }));

            // === Logo ===
            const logoSize = 13;
            if (logoDataUrl) {
                doc.setFillColor(0, 0, 0);
                doc.roundedRect(7, 4.5, logoSize + 3, logoSize + 3, 2.5, 2.5, 'F');
                doc.setDrawColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
                doc.setGState(doc.GState({ opacity: 0.2 }));
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
            doc.text('FOUNDATION', textX, 15.5);
            const foW = doc.getTextWidth('FOUNDATION ');
            doc.setTextColor(200, 200, 200);
            doc.text('OF', textX + foW, 15.5);
            const ofW = doc.getTextWidth('OF ');
            doc.setTextColor(19, 136, 8);
            doc.text('INDIA', textX + foW + ofW, 15.5);

            // "OFFICIAL IDENTITY CARD"
            doc.setFontSize(3.5);
            doc.setTextColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.text('OFFICIAL IDENTITY CARD', textX, 19.5);

            // ID badge (top right)
            const memNum = user?.membershipNumber || 'PENDING';
            const badgeW = Math.max(doc.getTextWidth(memNum) * 1.1 + 10, 34);
            const badgeX = W - badgeW - 7;
            doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.setGState(doc.GState({ opacity: 0.06 }));
            doc.roundedRect(badgeX, 4, badgeW, 17, 2, 2, 'F');
            doc.setGState(doc.GState({ opacity: 0.15 }));
            doc.setDrawColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.roundedRect(badgeX, 4, badgeW, 17, 2, 2, 'S');
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.setFontSize(3.5);
            doc.setTextColor(100, 100, 100);
            doc.text('ID', badgeX + 4, 9);
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(memNum, badgeX + 4, 16.5);

            // === Role title ===
            const roleY = 33;
            doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.circle(9, roleY - 0.8, 0.9, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(4.5);
            doc.setTextColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
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

            // === Member since + belt rank ===
            const midY = roleY + 17;
            doc.setFontSize(3.8);
            doc.setTextColor(100, 100, 100);
            doc.text(`SINCE ${pdfMemberSince.toUpperCase()}`, 8, midY);

            // Belt indicator (small colored bar + text)
            const beltX = 45;
            doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.rect(beltX, midY - 2.5, 8, 0.8, 'F');
            doc.setTextColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.text(belt.toUpperCase(), beltX + 11, midY);

            // Divider
            doc.setDrawColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.setGState(doc.GState({ opacity: 0.12 }));
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
                doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
                doc.setGState(doc.GState({ opacity: 0.04 }));
                doc.roundedRect(bx, statsY, boxW, statsH, 1.5, 1.5, 'F');
                doc.setGState(doc.GState({ opacity: 0.1 }));
                doc.setDrawColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
                doc.roundedRect(bx, statsY, boxW, statsH, 1.5, 1.5, 'S');
                doc.setGState(doc.GState({ opacity: 1 }));

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(3.2);
                doc.setTextColor(90, 90, 90);
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
            doc.setFillColor(pdfAccent[0], pdfAccent[1], pdfAccent[2]);
            doc.rect(0, H - 0.7, W, 0.7, 'F');

            doc.save(`KKFI_Card_${user?.membershipNumber || 'member'}.pdf`);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setIsDownloading(false);
        }
    }, [user, verifyUrl, belt, beltBase, isBlack, accent.rgb]);

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
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                    className="cursor-pointer group"
                >
                    <div
                        ref={cardRef}
                        className="relative rounded-xl overflow-hidden border border-white/[0.06]"
                        style={{
                            aspectRatio: '1.6 / 1',
                            boxShadow: `0 40px 100px -25px rgba(${accent.rgb}, 0.25), 0 0 0 1px rgba(0,0,0,0.8)`,
                        }}
                    >
                        {/* ── Deep black background ── */}
                        <div className="absolute inset-0 bg-[#060606]" />

                        {/* Brushed metal / grain texture */}
                        <div className="absolute inset-0 opacity-[0.035]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                            }} />

                        {/* Diagonal slash — ninja cut across the card */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute opacity-[0.04]"
                                style={{
                                    background: `linear-gradient(135deg, transparent 40%, ${accent.color}, transparent 60%)`,
                                    width: '200%', height: '200%', top: '-50%', left: '-50%',
                                }} />
                        </div>

                        {/* Aggressive corner glow — top right hot zone */}
                        <div className="absolute -top-10 -right-10 w-72 h-72 opacity-[0.08]"
                            style={{ background: `radial-gradient(circle, ${accent.color}, transparent 60%)` }} />

                        {/* Faint bottom-left ember */}
                        <div className="absolute -bottom-8 -left-8 w-48 h-48 opacity-[0.05]"
                            style={{ background: `radial-gradient(circle, ${accent.color}, transparent 60%)` }} />

                        {/* Top accent blade — sharp edge */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{ background: `linear-gradient(90deg, transparent 10%, ${accent.color}, transparent 90%)` }} />

                        {/* ── Content ── */}
                        <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between z-10">

                            {/* === Top row: Logo + Org name | ID Badge === */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                    {/* Logo */}
                                    <div className="relative">
                                        <div className="absolute -inset-1.5 rounded-xl blur-lg opacity-25"
                                            style={{ background: accent.color }} />
                                        <div className="relative bg-black p-1.5 sm:p-2 rounded-xl border"
                                            style={{ borderColor: `rgba(${accent.rgb}, 0.2)` }}>
                                            <Image src="/kkfi-logo.avif" alt="KKFI" width={32} height={32}
                                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-black tracking-[0.04em] text-white leading-none">
                                            KYOKUSHIN KARATE
                                        </h3>
                                        <p className="text-[7px] sm:text-[8px] font-bold tracking-[0.2em] mt-0.5">
                                            <span className="bg-gradient-to-r from-orange-400 via-white to-green-500 bg-clip-text text-transparent">
                                                FOUNDATION OF INDIA
                                            </span>
                                        </p>
                                        {/* "OFFICIAL IDENTITY CARD" — professional, clean */}
                                        <p className="text-[6px] sm:text-[7px] font-bold tracking-[0.3em] mt-1.5 uppercase"
                                            style={{ color: `rgba(${accent.rgb}, 0.6)` }}>
                                            OFFICIAL IDENTITY CARD
                                        </p>
                                    </div>
                                </div>

                                {/* ID badge */}
                                <div className="backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg border"
                                    style={{
                                        background: `rgba(${accent.rgb}, 0.05)`,
                                        borderColor: `rgba(${accent.rgb}, 0.12)`,
                                    }}>
                                    <p className="text-[6px] sm:text-[7px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-0.5">ID</p>
                                    <p className="text-[9px] sm:text-xs font-black tracking-wider text-white">
                                        {user?.membershipNumber || (user?.membershipStatus === 'ACTIVE' ? 'GENERATING…' : 'PENDING')}
                                    </p>
                                </div>
                            </div>

                            {/* === Middle: Role + Name + Belt line === */}
                            <div className="flex-1 flex flex-col justify-center min-h-0 py-1">
                                {/* Role dot + title */}
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent.color }} />
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em]"
                                        style={{ color: accent.color }}>
                                        {roleTitle}
                                    </span>
                                </div>

                                {/* Name — big, aggressive, uppercase */}
                                <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight leading-[1.05]"
                                    style={{ textShadow: `0 0 40px rgba(${accent.rgb}, 0.15)` }}>
                                    {roleTitle !== 'KARATEKA' ? `${roleTitle} ` : ''}{user?.name?.replace(new RegExp(`^${roleTitle}\\s+`, 'i'), '')}
                                </h2>

                                {/* Since + Belt rank with slash accent */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[7px] sm:text-[8px] text-gray-500 tracking-[0.1em] font-medium">
                                        SINCE {memberSince.toUpperCase()}
                                    </span>
                                    <span className="w-4 h-[1px]" style={{ background: accent.color }} />
                                    <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.1em]"
                                        style={{ color: accent.color }}>
                                        {belt.toUpperCase()}
                                    </span>
                                    {/* Dan marks — small slashes for each dan level */}
                                    {danLevel > 0 && (
                                        <div className="flex gap-0.5 ml-1">
                                            {Array.from({ length: Math.min(danLevel, 10) }).map((_, i) => (
                                                <span key={i} className="w-[2px] h-2 rounded-full" style={{ background: accent.color, opacity: 0.7 }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* === Divider — angled slash line === */}
                            <div className="relative h-px w-full mb-2 sm:mb-3">
                                <div className="absolute inset-0"
                                    style={{ background: `linear-gradient(90deg, ${accent.color}00, rgba(${accent.rgb}, 0.25) 20%, rgba(${accent.rgb}, 0.25) 80%, ${accent.color}00)` }} />
                            </div>

                            {/* === Bottom: Stats row + QR === */}
                            <div className="flex items-end justify-between gap-2">
                                <div className="flex gap-1 sm:gap-1.5 flex-1 min-w-0">
                                    {[
                                        { label: 'Rank', value: belt, dot: true },
                                        { label: 'Dojo', value: user?.dojo?.name || 'HQ' },
                                        { label: 'Exp', value: experience.display, fire: true },
                                        { label: 'Valid', value: validThru },
                                    ].map((item, i) => (
                                        <div key={i} className="flex-1 min-w-0 rounded-md p-1.5 sm:p-2 border"
                                            style={{
                                                background: `rgba(${accent.rgb}, 0.03)`,
                                                borderColor: `rgba(${accent.rgb}, 0.07)`,
                                            }}>
                                            <p className="text-[5px] sm:text-[6px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-0.5">{item.label}</p>
                                            <div className="flex items-center gap-0.5 sm:gap-1">
                                                {item.dot && (
                                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                                                        style={{ background: accent.color }} />
                                                )}
                                                {item.fire && (
                                                    <Flame className="w-2.5 h-2.5 flex-shrink-0" style={{ color: accent.color }} />
                                                )}
                                                <span className="text-[8px] sm:text-[10px] font-black text-white truncate">{item.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* QR Code */}
                                <div className="flex-shrink-0">
                                    <div className="bg-white p-1 sm:p-1.5 rounded-md shadow-2xl"
                                        style={{ boxShadow: `0 0 20px rgba(${accent.rgb}, 0.1)` }}>
                                        {user?.membershipNumber ? (
                                            <QRCodeSVG
                                                value={verifyUrl || user.membershipNumber}
                                                size={46}
                                                bgColor="#ffffff"
                                                fgColor="#0a0a0a"
                                                level="M"
                                                includeMargin={false}
                                            />
                                        ) : (
                                            <div className="w-[46px] h-[46px] flex items-center justify-center text-gray-400 text-[7px] font-bold">PENDING</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom accent blade */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={{ background: `linear-gradient(90deg, transparent 10%, ${accent.color}, transparent 90%)` }} />

                        {/* Kanku mark — the iconic ∞ circle, faint watermark bottom-right */}
                        <div className="absolute bottom-3 right-16 sm:right-20 opacity-[0.03] pointer-events-none">
                            <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="50" cy="50" r="40" className="text-white" />
                                <path d="M50 10 L42 42 L10 50 L42 58 L50 90 L58 58 L90 50 L58 42 Z" className="text-white" fill="currentColor" fillOpacity="0.3" />
                            </svg>
                        </div>
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
                        className="group/btn flex items-center gap-2 px-5 py-2.5 border rounded-lg text-white text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                            background: `rgba(${accent.rgb}, 0.06)`,
                            borderColor: `rgba(${accent.rgb}, 0.15)`,
                        }}
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Saving...' : 'Download'}
                    </button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-white text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                            style={{
                                background: `rgba(${accent.rgb}, 0.06)`,
                                borderColor: `rgba(${accent.rgb}, 0.15)`,
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
