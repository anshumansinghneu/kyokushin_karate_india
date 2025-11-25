import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Shield, QrCode } from "lucide-react";
import { useState } from "react";

interface MembershipCardProps {
    user: any;
}

export default function MembershipCard({ user }: MembershipCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

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

    return (
        <div className="perspective-1000 w-full max-w-md mx-auto">
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[1.586/1] rounded-2xl shadow-2xl cursor-pointer transition-shadow duration-200 ease-out hover:shadow-3xl"
            >
                {/* Card Background */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-white/10 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/dojo-bg.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />

                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] bg-repeat mix-blend-overlay" />
                </div>

                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between z-10" style={{ transform: "translateZ(50px)" }}>
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary blur-lg opacity-50" />
                                <Shield className="w-10 h-10 text-primary relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tighter uppercase leading-none drop-shadow-lg">Kyokushin<br />Karate</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">India</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Membership ID</p>
                            <p className="text-sm font-mono text-white tracking-wider drop-shadow-md">{user?.membershipNumber || "PENDING"}</p>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Student Name</p>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4 drop-shadow-lg">{user?.name}</h2>

                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Rank</p>
                                    <p className="text-sm font-bold text-primary drop-shadow-md">{user?.currentBeltRank || "White Belt"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Dojo</p>
                                    <p className="text-sm font-bold text-white drop-shadow-md">{user?.dojo?.name || "Main Dojo"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Valid Thru</p>
                                    <p className="text-sm font-bold text-white drop-shadow-md">12/25</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="bg-white p-2 rounded-lg shadow-lg">
                            <QrCode className="w-12 h-12 text-black" />
                        </div>
                    </div>
                </div>

                {/* Holographic / Sheen Effect */}
                <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ transform: "translateZ(60px)" }}
                />
            </motion.div>
        </div>
    );
}
