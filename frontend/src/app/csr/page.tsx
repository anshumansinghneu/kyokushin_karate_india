"use client";

import { motion } from "framer-motion";
import {
    Heart, Users, GraduationCap, Shield, Target, Sparkles,
    HandHeart, School, Dumbbell, Globe, ArrowRight, Mail,
    Phone, Building2, CheckCircle2, TrendingUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const csrPrograms = [
    {
        icon: School,
        title: "School Outreach Program",
        description: "Free self-defense and discipline workshops in government schools across India, reaching 500+ students annually. We believe every child deserves to learn confidence and resilience.",
        impact: "500+ Students Reached",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
    },
    {
        icon: Heart,
        title: "Free Training for Underprivileged",
        description: "Scholarship program providing free Kyokushin Karate training, uniforms, and equipment to underprivileged youth who show dedication and potential.",
        impact: "50+ Scholarships Given",
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
    },
    {
        icon: Users,
        title: "Women's Self-Defense Initiative",
        description: "Dedicated self-defense camps for women and girls in rural and semi-urban areas. Empowering women through martial arts training and mental strength.",
        impact: "30+ Camps Conducted",
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20",
    },
    {
        icon: Dumbbell,
        title: "Community Health & Fitness",
        description: "Free fitness sessions and health awareness camps in communities, promoting physical fitness and mental well-being through martial arts discipline.",
        impact: "1000+ Participants",
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
    },
    {
        icon: GraduationCap,
        title: "Youth Empowerment Program",
        description: "Anti-bullying workshops and character development through martial arts philosophy — teaching respect, perseverance, and integrity to young minds.",
        impact: "20+ Schools Covered",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
    },
    {
        icon: Globe,
        title: "Rural Karate Development",
        description: "Establishing karate training centers in rural India where martial arts facilities are non-existent, nurturing talent from grassroots levels.",
        impact: "10+ Rural Centers",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/20",
    },
];

const impactStats = [
    { value: "1500+", label: "Lives Impacted" },
    { value: "30+", label: "Programs Conducted" },
    { value: "50+", label: "Scholarships" },
    { value: "15+", label: "Partner Organizations" },
];

const csrPartners = [
    {
        name: "Shri Gang Industries",
        description: "A valued CSR partner committed to community empowerment through sports and education initiatives.",
        website: "https://www.shrigangindustries.com/",
        logo: "https://www.shrigangindustries.com/assets/img/logo.png",
    },
];

export default function CSRPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-red-500/30">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(220,38,38,0.06),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(34,197,94,0.05),_transparent_60%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" />
            </div>

            <div className="container mx-auto px-4 py-24 relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
                    >
                        <HandHeart className="w-4 h-4" /> Corporate Social Responsibility
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
                        BUILDING A{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">
                            STRONGER
                        </span>
                        <br />
                        COMMUNITY
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        At <span className="text-white font-semibold">Kyokushin Karate Federation of India</span>,
                        we go beyond martial arts. Through our CSR initiatives, we empower youth,
                        uplift communities, and create a healthier, stronger India.
                    </p>
                </motion.div>

                {/* Impact Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-24"
                >
                    {impactStats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm hover:border-green-500/30 transition-colors"
                        >
                            <p className="text-3xl md:text-4xl font-black text-green-400 mb-1">{stat.value}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Mission Statement */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto mb-24"
                >
                    <div className="relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-12 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <Target className="w-6 h-6 text-green-400" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white">Our Mission</h2>
                            </div>
                            <p className="text-gray-400 leading-relaxed text-base md:text-lg mb-6">
                                Kyokushin Karate teaches more than fighting — it teaches{" "}
                                <span className="text-white font-semibold">discipline, respect, and perseverance</span>.
                                We leverage these values to create social impact through structured CSR programs
                                that reach the most vulnerable sections of society.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { icon: Shield, text: "Empower youth through martial arts" },
                                    { icon: TrendingUp, text: "Build healthier communities" },
                                    { icon: Star, text: "Nurture future champions" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                                        <item.icon className="w-5 h-5 text-green-400 shrink-0" />
                                        <span className="text-sm text-gray-300 font-medium">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* CSR Programs */}
                <div className="mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            OUR <span className="text-green-400">PROGRAMS</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Impactful initiatives that combine the discipline of martial arts with community development.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {csrPrograms.map((program, i) => {
                            const Icon = program.icon;
                            return (
                                <motion.div
                                    key={program.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`group bg-white/[0.03] border ${program.borderColor} rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300`}
                                >
                                    <div className={`inline-flex p-3 rounded-xl ${program.bgColor} mb-4`}>
                                        <Icon className={`w-6 h-6 ${program.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{program.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{program.description}</p>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${program.bgColor} ${program.color} text-xs font-bold`}>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {program.impact}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* CSR Partners */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto mb-24"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
                        CSR <span className="text-green-400">PARTNERS</span>
                    </h2>
                    <div className="space-y-6">
                        {csrPartners.map((partner, i) => (
                            <motion.div
                                key={partner.name}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="flex flex-col sm:flex-row items-center gap-6 bg-white/[0.04] border border-green-500/20 rounded-2xl p-6 md:p-8 hover:border-green-500/40 transition-colors"
                            >
                                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-lg">
                                    <img
                                        src={partner.logo}
                                        alt={partner.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-xl font-bold text-white mb-2">{partner.name}</h3>
                                    <p className="text-sm text-gray-400 mb-3">{partner.description}</p>
                                    <a
                                        href={partner.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-green-400 text-sm font-bold hover:text-green-300 transition-colors"
                                    >
                                        Visit Website <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Accept CSR CTA */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto mb-16"
                >
                    <div className="group relative bg-gradient-to-br from-green-900/30 to-black border border-green-500/20 rounded-[2.5rem] p-10 md:p-14 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            <div className="inline-flex p-4 rounded-full bg-green-500/10 mb-6">
                                <Building2 className="w-10 h-10 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                            </div>

                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="inline-block px-4 py-1.5 mb-4 bg-green-500/10 border border-green-500/30 rounded-full"
                            >
                                <span className="text-green-400 text-sm font-bold uppercase tracking-wider">We Accept CSR Contributions</span>
                            </motion.div>

                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                Partner With Us
                            </h2>
                            <p className="text-gray-400 mb-6 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                                Your CSR contributions can help us expand our programs, reach more communities,
                                and create lasting social impact through martial arts. We are registered and compliant
                                with CSR regulations under the Companies Act.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                                {[
                                    "Section 135 Compliant",
                                    "Tax Benefits Available",
                                    "Impact Reports Provided",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                        <span className="text-xs text-gray-300 font-semibold">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="mailto:kyokushinkarateindia@gmail.com?subject=CSR%20Partnership%20Inquiry">
                                    <Button className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-[0_10px_30px_-10px_rgba(34,197,94,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(34,197,94,0.6)] transition-all hover:-translate-y-1">
                                        <Mail className="w-5 h-5 mr-2" /> Enquire for CSR
                                    </Button>
                                </a>
                                <a href="tel:+919876543210">
                                    <Button variant="ghost" className="text-white border border-white/10 hover:bg-white/5 font-bold px-8 py-6 text-lg rounded-2xl">
                                        <Phone className="w-5 h-5 mr-2" /> Call Us
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Bottom Note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-xs text-gray-600 max-w-2xl mx-auto"
                >
                    Kyokushin Karate Federation of India is committed to transparency. All CSR contributions
                    are documented and impact reports are shared with contributing organizations.
                </motion.p>
            </div>
        </div>
    );
}
