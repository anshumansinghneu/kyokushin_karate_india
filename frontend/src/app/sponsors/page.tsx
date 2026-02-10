"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Star, Award, ShieldCheck, Heart, Mail, ExternalLink, Sparkles, Building2, Factory, ChefHat, Train, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MouseEvent } from "react";

const sponsors = [
    {
        name: "Goldiee Group",
        tagline: "The Epitome of Quality Since 1980",
        description: "One of India's largest producers of quality spices and food products. Founded in 1980, Goldiee Group has grown into a household name with 4000+ employees, 1500+ distributors, and 500,000+ retailers across India. Winner of The Economic Times Best Brands 2020.",
        website: "https://goldiee.com/",
        logo: "https://goldiee.com/wp-content/uploads/2018/10/Logo_.png",
        color: "from-yellow-600 to-orange-700",
        borderColor: "border-yellow-500/30",
        glowColor: "rgba(234,179,8,0.3)",
        accentColor: "text-yellow-400",
        bgAccent: "bg-yellow-500/10",
        icon: ChefHat,
        stats: [
            { label: "Founded", value: "1980" },
            { label: "Employees", value: "4000+" },
            { label: "Distributors", value: "1500+" },
            { label: "Products", value: "100+" },
        ],
        achievements: ["ET Best Brands 2020", "FSSAI Certified", "AGMARK Certified", "Govt. Recognized"],
        location: "Kanpur, Uttar Pradesh",
    },
    {
        name: "Frontier Alloys",
        tagline: "Trailblazers in Rolling Stock Components",
        description: "Leading manufacturer of railway rolling stock components including couplers, buffers, bogies, wheels, and draft gears. With 38+ years of service to Indian Railways and state-of-the-art facilities in Kanpur and Paonta Sahib. ISO 9001 & IRIS certified.",
        website: "https://www.frontieralloy.com/",
        logo: "https://static.wixstatic.com/media/2a0662_67b739277d564fc79ac52eee67e02837~mv2.png",
        color: "from-blue-600 to-cyan-700",
        borderColor: "border-blue-500/30",
        glowColor: "rgba(59,130,246,0.3)",
        accentColor: "text-blue-400",
        bgAccent: "bg-blue-500/10",
        icon: Train,
        stats: [
            { label: "Years of Service", value: "38+" },
            { label: "Facilities", value: "3" },
            { label: "Certifications", value: "ISO/IRIS" },
            { label: "Sector", value: "Railways" },
        ],
        achievements: ["ISO 9001 Certified", "IRIS Certified", "Class A Foundry", "Indian Railways Approved"],
        location: "Kanpur, UP & Paonta Sahib, HP",
    },
];

function SponsorCard({ sponsor, index }: { sponsor: typeof sponsors[0]; index: number }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    const rotateX = useTransform(mouseY, [-200, 200], [3, -3]);
    const rotateY = useTransform(mouseX, [-200, 200], [-3, 3]);
    const Icon = sponsor.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            className={`group relative rounded-[2rem] overflow-hidden border ${sponsor.borderColor} bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl shadow-2xl`}
        >
            {/* Glow effect */}
            <div
                className="absolute -inset-1 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10"
                style={{ background: `radial-gradient(600px circle, ${sponsor.glowColor}, transparent 70%)` }}
            />

            {/* Top accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${sponsor.color}`} />

            <div className="p-8 md:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                    {/* Logo */}
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl group-hover:scale-105 transition-transform duration-500 shrink-0">
                        <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                                {sponsor.name}
                            </h3>
                            <div className={`p-2 rounded-xl ${sponsor.bgAccent}`}>
                                <Icon className={`w-5 h-5 ${sponsor.accentColor}`} />
                            </div>
                        </div>
                        <p className={`text-sm font-bold uppercase tracking-[0.15em] ${sponsor.accentColor} mb-3`}>
                            {sponsor.tagline}
                        </p>
                        <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                            {sponsor.description}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {sponsor.stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <p className={`text-2xl font-black ${sponsor.accentColor}`}>{stat.value}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Achievements */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {sponsor.achievements.map((achievement, i) => (
                        <span
                            key={i}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${sponsor.bgAccent} ${sponsor.accentColor} border ${sponsor.borderColor}`}
                        >
                            {achievement}
                        </span>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe className="w-4 h-4" />
                        <span>{sponsor.location}</span>
                    </div>
                    <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${sponsor.color} text-white font-bold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300`}
                    >
                        Visit Website <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}

export default function SponsorsPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-red-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(100,0,0,0.08),_transparent_70%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" />
                <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] bg-yellow-600/5 blur-[150px] rounded-full" />
                <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-4 py-24 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
                    >
                        <Sparkles className="w-4 h-4" /> Proud Partners
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
                        OUR{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600">
                            SPONSORS
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Empowering the spirit of <span className="text-white font-semibold">Kyokushin Karate</span> in India.
                        We are honoured to be supported by these industry leaders.
                    </p>
                </motion.div>

                {/* Sponsor Cards */}
                <div className="max-w-5xl mx-auto space-y-12 mb-32">
                    {sponsors.map((sponsor, index) => (
                        <SponsorCard key={sponsor.name} sponsor={sponsor} index={index} />
                    ))}
                </div>

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="group relative bg-gradient-to-br from-red-900/30 to-black border border-red-500/20 rounded-[2.5rem] p-10 md:p-14 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/dojo-bg.png')] opacity-5 bg-cover bg-center mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-8">
                                <Heart className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                Become a Sponsor
                            </h2>
                            <p className="text-gray-400 mb-10 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                                Support the growth of Kyokushin Karate in India and connect with our dedicated community
                                of martial artists, families, and fans across the nation.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="mailto:kyokushinkarateindia@gmail.com">
                                    <Button className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.6)] transition-all hover:-translate-y-1">
                                        <Mail className="w-5 h-5 mr-2" /> Contact Us
                                    </Button>
                                </a>
                                <Link href="/contact">
                                    <Button variant="ghost" className="text-white border border-white/10 hover:bg-white/5 font-bold px-8 py-6 text-lg rounded-2xl">
                                        Learn More <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
