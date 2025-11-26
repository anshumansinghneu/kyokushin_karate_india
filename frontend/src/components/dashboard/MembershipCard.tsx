import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Shield, QrCode, Sparkles } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface MembershipCardProps {
    user: any;
}

export default function MembershipCard({ user }: MembershipCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12.5deg", "-12.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12.5deg", "12.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const membershipStatus = user?.membershipStatus || 'PENDING';
    const statusColors = {
        'ACTIVE': 'from-green-500 to-emerald-600',
        'PENDING': 'from-yellow-500 to-orange-600',
        'EXPIRED': 'from-gray-500 to-gray-700',
        'SUSPENDED': 'from-red-500 to-red-700'
    };

    return (
        <div className="perspective-1000 w-full max-w-2xl mx-auto">
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative aspect-[1.586/1] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] cursor-pointer transition-all duration-300 ease-out hover:shadow-[0_30px_80px_-15px_rgba(239,68,68,0.4)]"
            >
                {/* Holographic Shine Effect */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Card Background - Premium Dark Theme */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-2 border-white/20 overflow-hidden backdrop-blur-xl">
                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-black to-orange-950/30 animate-gradient-slow" />
                    
                    {/* Subtle Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                        <div className="absolute inset-0 bg-[url('/dojo-bg.png')] bg-cover bg-center mix-blend-overlay opacity-30" />
                    </div>

                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusColors[membershipStatus as keyof typeof statusColors]}`} />
                </div>

                {/* Card Content */}
                <div className="relative h-full p-8 flex flex-col justify-between z-10" style={{ transform: "translateZ(50px)" }}>
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-red-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-3 rounded-2xl border border-white/20">
                                    <Shield className="w-10 h-10 text-white" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight uppercase leading-none mb-1">
                                    <span className="text-white">KYOKUSHIN KARATE</span>
                                </h3>
                                <p className="text-sm font-bold tracking-wider">
                                    <span className="bg-gradient-to-r from-orange-500 via-white to-green-500 bg-clip-text text-transparent">
                                        FOUNDATION OF INDIA
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Membership ID</p>
                            <p className={`text-base font-bold tracking-wider bg-gradient-to-r ${statusColors[membershipStatus as keyof typeof statusColors]} bg-clip-text text-transparent`}>
                                {user?.membershipNumber || "PENDING"}
                            </p>
                        </div>
                    </div>

                    {/* Middle Section - User Info */}
                    <div className="flex items-end justify-between mt-auto">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-green-500" />
                                Student Name
                            </p>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-6 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                                {user?.name}
                            </h2>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rank</p>
                                    <p className="text-sm font-black text-red-500 drop-shadow-md">{user?.currentBeltRank || "White Belt"}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dojo</p>
                                    <p className="text-xs font-bold text-white drop-shadow-md line-clamp-2">{user?.dojo?.name || "Main Dojo"}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valid Thru</p>
                                    <p className="text-sm font-black text-white drop-shadow-md">12/25</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code - Premium Design */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-white blur-lg opacity-30 group-hover:opacity-40 transition-opacity rounded-2xl" />
                            <div className="relative bg-white p-3 rounded-2xl shadow-2xl border-2 border-white/50 backdrop-blur-sm">
                                <QrCode className="w-16 h-16 text-black" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Bar - Fixed positioning */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse bg-gradient-to-r ${statusColors[membershipStatus as keyof typeof statusColors]}`} />
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Status: {membershipStatus}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-medium">Verified Member</span>
                        </div>
                    </div>
                </div>

                {/* Holographic / Sheen Effect on Hover */}
                <motion.div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ 
                        transform: "translateZ(60px)",
                        background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)"
                    }}
                />

                {/* Glow Effect on Hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-white to-green-500 rounded-3xl opacity-0 hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10" />
            </motion.div>
        </div>
    );
}
