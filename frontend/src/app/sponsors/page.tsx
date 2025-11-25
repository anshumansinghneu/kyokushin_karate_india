"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Star, Award, ShieldCheck, Heart, Mail, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MouseEvent, useRef } from "react";

const sponsors = {
    platinum: [
        { name: "Goldie Masala", logo: "/logos/goldie.png", description: "A household name in India, delivering authentic spices and food products since 1980." },
        { name: "Frontier Alloys", logo: "/logos/frontier.png", description: "Leading manufacturer of railway components. Director: Manu Bhatia." },
        { name: "Global Karate Supply", logo: "/logos/sponsor1.png", description: "Official equipment partner for all our tournaments." },
    ],
    gold: [
        { name: "Dojo Master Pro", logo: "/logos/sponsor3.png" },
        { name: "Nutrition First", logo: "/logos/sponsor4.png" },
        { name: "TechStrike", logo: "/logos/sponsor5.png" },
    ],
    silver: [
        { name: "Local Print Shop", logo: "/logos/sponsor6.png" },
        { name: "City Water", logo: "/logos/sponsor7.png" },
        { name: "Event Secure", logo: "/logos/sponsor8.png" },
        { name: "MedCare", logo: "/logos/sponsor9.png" },
    ]
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function PlatinumCard({ sponsor }: { sponsor: typeof sponsors.platinum[0] }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
    const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => {
                x.set(0);
                y.set(0);
            }}
            className="group relative bg-gradient-to-br from-white/10 to-white/0 border border-yellow-500/30 rounded-3xl p-8 overflow-hidden backdrop-blur-md shadow-2xl hover:shadow-yellow-500/20 transition-shadow duration-500"
        >
            {/* Holographic Shine */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent z-20" style={{ transform: "translateZ(50px)" }} />

            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10" style={{ transform: "translateZ(20px)" }}>
                <div className="w-32 h-32 bg-black/50 rounded-2xl flex items-center justify-center border border-white/10 p-4 shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="text-center relative z-10">
                        <ShieldCheck className="w-12 h-12 text-yellow-500 mx-auto mb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Logo</span>
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-yellow-400 transition-colors">{sponsor.name}</h3>
                    <p className="text-gray-400 mb-4 text-sm leading-relaxed">{sponsor.description}</p>
                    <Button variant="ghost" className="text-yellow-500 p-0 h-auto hover:text-yellow-300 hover:bg-transparent group/btn">
                        Visit Website <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-white/10 bg-white/5 overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.15),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

export default function SponsorsPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-yellow-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(100,0,0,0.1),_transparent_70%)] animate-pulse duration-[10000ms]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" />
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-yellow-600/10 blur-[120px] rounded-full mix-blend-screen animate-blob" />
                <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <div className="container mx-auto px-4 py-20 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-24"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    >
                        <Star className="w-4 h-4 fill-yellow-500 animate-spin-slow" /> Our Partners
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 relative">
                        <span className="relative z-10">OFFICIAL</span> <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 relative z-10 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">SPONSORS</span>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-500/20 blur-[100px] -z-10" />
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Empowering the spirit of <span className="text-white font-semibold">Kyokushin</span>. We are proud to be supported by these industry leaders.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-32"
                >
                    {/* Platinum Sponsors */}
                    <motion.section variants={itemVariants} className="relative">
                        <div className="flex items-center justify-center gap-6 mb-16">
                            <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent w-32 opacity-50" />
                            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-yellow-400 flex items-center gap-4 drop-shadow-lg">
                                <Award className="w-8 h-8" /> Platinum Partners
                            </h2>
                            <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent w-32 opacity-50" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto perspective-1000">
                            {sponsors.platinum.map((sponsor, i) => (
                                <PlatinumCard key={i} sponsor={sponsor} />
                            ))}
                        </div>
                    </motion.section>

                    {/* Gold Sponsors */}
                    <motion.section variants={itemVariants}>
                        <div className="flex items-center justify-center gap-6 mb-16">
                            <div className="h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent w-24 opacity-30" />
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-yellow-100 flex items-center gap-4 drop-shadow-md">
                                <Award className="w-6 h-6" /> Gold Partners
                            </h2>
                            <div className="h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent w-24 opacity-30" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {sponsors.gold.map((sponsor, i) => (
                                <SpotlightCard key={i} className="rounded-2xl p-8 text-center hover:bg-white/10 transition-colors group">
                                    <div className="w-20 h-20 bg-black/40 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <ShieldCheck className="w-8 h-8 text-yellow-200" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white tracking-wide">{sponsor.name}</h3>
                                </SpotlightCard>
                            ))}
                        </div>
                    </motion.section>

                    {/* Silver Sponsors */}
                    <motion.section variants={itemVariants}>
                        <div className="flex items-center justify-center gap-6 mb-16">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24 opacity-30" />
                            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-4">
                                <Award className="w-5 h-5" /> Silver Partners
                            </h2>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24 opacity-30" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                            {sponsors.silver.map((sponsor, i) => (
                                <SpotlightCard key={i} className="rounded-xl p-6 text-center hover:bg-white/10 transition-colors grayscale hover:grayscale-0 duration-300">
                                    <h3 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{sponsor.name}</h3>
                                </SpotlightCard>
                            ))}
                        </div>
                    </motion.section>

                    {/* CTA */}
                    <motion.section variants={itemVariants} className="max-w-4xl mx-auto mt-32">
                        <div className="group relative bg-gradient-to-br from-red-900/40 to-black border border-red-500/30 rounded-[2.5rem] p-12 text-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/dojo-bg.png')] opacity-10 bg-cover bg-center mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-8 animate-pulse">
                                    <Heart className="w-12 h-12 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Become a Sponsor</h2>
                                <p className="text-gray-300 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
                                    Support the growth of Kyokushin Karate and connect with our dedicated community.
                                    We offer various partnership packages tailored to your brand's goals.
                                </p>
                                <Button className="bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-8 text-xl rounded-2xl shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.6)] transition-all hover:-translate-y-1">
                                    <Mail className="w-6 h-6 mr-3" /> Contact Sponsorship Team
                                </Button>
                            </div>
                        </div>
                    </motion.section>
                </motion.div>
            </div>
        </div>
    );
}
