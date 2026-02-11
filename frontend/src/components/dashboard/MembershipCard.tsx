'use client';

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Shield, Sparkles, Download, Share2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
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
        dojo?: { name: string; city?: string } | null;
    };
    showDownload?: boolean;
}

const BELT_COLORS: Record<string, string> = {
    White: '#ffffff',
    Orange: '#f97316',
    Blue: '#3b82f6',
    Yellow: '#eab308',
    Green: '#22c55e',
    Brown: '#92400e',
    Black: '#000000',
};

export default function MembershipCard({ user, showDownload = true }: MembershipCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12.5deg", "-12.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12.5deg", "12.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const xPct = e.clientX / rect.width - 0.5;
        const yPct = e.clientY / rect.height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const membershipStatus = user?.membershipStatus || 'PENDING';
    const statusColors: Record<string, string> = {
        ACTIVE: 'from-green-500 to-emerald-600',
        PENDING: 'from-yellow-500 to-orange-600',
        EXPIRED: 'from-gray-500 to-gray-700',
        SUSPENDED: 'from-red-500 to-red-700',
        REJECTED: 'from-red-500 to-red-700',
    };

    const verifyUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/verify/${user?.membershipNumber || ''}`
        : '';

    const validThru = user?.membershipEndDate
        ? new Date(user.membershipEndDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
        : '--/--';

    const beltColor = BELT_COLORS[user?.currentBeltRank || 'White'] || '#ffffff';

    // ─── Download as PNG ──────────────────────────────────────────
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
            link.download = `KKFI-Card-${user?.membershipNumber || 'PENDING'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setIsDownloading(false);
        }
    }, [user?.membershipNumber]);

    // ─── Share ────────────────────────────────────────────────────
    const handleShare = useCallback(async () => {
        if (navigator.share && verifyUrl) {
            await navigator.share({
                title: `KKFI Membership - ${user?.name}`,
                text: `Verify my KKFI membership: ${user?.membershipNumber}`,
                url: verifyUrl,
            }).catch(() => {});
        }
    }, [user?.name, user?.membershipNumber, verifyUrl]);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Interactive 3D wrapper */}
            <div className="perspective-1000">
                <motion.div
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="cursor-pointer"
                >
                    {/* Static card for screenshot */}
                    <div
                        ref={cardRef}
                        className="relative aspect-[1.586/1] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-2 border-white/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-black to-orange-950/30" />
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                            </div>
                            {/* Top accent */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusColors[membershipStatus] || statusColors.PENDING}`} />
                            {/* Belt color stripe */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-1.5 opacity-80"
                                style={{ background: `linear-gradient(90deg, ${beltColor}, ${beltColor}88, ${beltColor})` }}
                            />
                        </div>

                        {/* Card Content */}
                        <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between z-10">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500 blur-xl opacity-30" />
                                        <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-2.5 sm:p-3 rounded-2xl border border-white/20">
                                            <Image
                                                src="/kkfi-logo.avif"
                                                alt="KKFI Logo"
                                                width={40}
                                                height={40}
                                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-2xl font-black tracking-tight uppercase leading-none mb-1">
                                            <span className="text-white">KYOKUSHIN KARATE</span>
                                        </h3>
                                        <p className="text-xs sm:text-sm font-bold tracking-wider">
                                            <span className="bg-gradient-to-r from-orange-500 via-white to-green-500 bg-clip-text text-transparent">
                                                FOUNDATION OF INDIA
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Membership ID</p>
                                    <p className={`text-sm sm:text-base font-bold tracking-wider bg-gradient-to-r ${statusColors[membershipStatus] || statusColors.PENDING} bg-clip-text text-transparent`}>
                                        {user?.membershipNumber || "PENDING"}
                                    </p>
                                </div>
                            </div>

                            {/* Middle - User Info */}
                            <div className="flex items-end justify-between mt-auto">
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 sm:mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-green-500" />
                                        {user?.role === 'INSTRUCTOR' ? 'Instructor' : user?.role === 'ADMIN' ? 'Admin' : 'Student'} Name
                                    </p>
                                    <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4 sm:mb-6 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                                        {user?.name}
                                    </h2>

                                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                                        <div className="bg-white/5 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-white/10">
                                            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rank</p>
                                            <p className="text-xs sm:text-sm font-black drop-shadow-md" style={{ color: beltColor === '#ffffff' ? '#e5e5e5' : beltColor }}>
                                                {user?.currentBeltRank || "White"} Belt
                                            </p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-white/10">
                                            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dojo</p>
                                            <p className="text-[10px] sm:text-xs font-bold text-white drop-shadow-md line-clamp-2">{user?.dojo?.name || "Unassigned"}</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-white/10">
                                            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valid Thru</p>
                                            <p className="text-xs sm:text-sm font-black text-white drop-shadow-md">{validThru}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="relative group ml-4">
                                    <div className="absolute inset-0 bg-white blur-lg opacity-20 group-hover:opacity-30 transition-opacity rounded-2xl" />
                                    <div className="relative bg-white p-2 sm:p-3 rounded-2xl shadow-2xl border-2 border-white/50">
                                        {user?.membershipNumber ? (
                                            <QRCodeSVG
                                                value={verifyUrl || user.membershipNumber}
                                                size={64}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                                level="M"
                                                includeMargin={false}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 flex items-center justify-center text-gray-400 text-[10px]">
                                                PENDING
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Bar at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2.5 bg-black/60 backdrop-blur-md border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse bg-gradient-to-r ${statusColors[membershipStatus] || statusColors.PENDING}`} />
                                <span className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider">
                                    Status: {membershipStatus}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs font-medium">
                                    {membershipStatus === 'ACTIVE' ? 'Verified Member' : 'Verification Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Glow on hover */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-white to-green-500 rounded-3xl opacity-0 hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10" />
                    </div>
                </motion.div>
            </div>

            {/* Download & Share Buttons */}
            {showDownload && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 justify-center mt-6"
                >
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Saving...' : 'Download Card'}
                    </button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
