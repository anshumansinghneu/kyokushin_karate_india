"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import KankuMark from "./KankuMark";

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Footer() {
    return (
        <footer className="relative bg-black border-t border-transparent pt-0 pb-24 md:pb-8 z-50 overflow-hidden">
            {/* Animated gradient top border */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-600 to-transparent" />

            {/* Kanku watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                <KankuMark className="w-[400px] h-[400px] text-white opacity-[0.03]" />
            </div>

            {/* Japanese text watermark */}
            <p className="absolute -right-6 top-16 text-[120px] font-black text-white/[0.02] tracking-tighter select-none pointer-events-none rotate-90 origin-top-right hidden lg:block">
                極真空手
            </p>

            <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="container mx-auto px-3 sm:px-4 lg:px-8 pt-10 sm:pt-14 md:pt-16 relative z-10"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12 md:mb-16">
                    {/* Brand */}
                    <motion.div variants={fadeUp} className="space-y-4 sm:space-y-6 col-span-1 sm:col-span-2 lg:col-span-1">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white italic">OSU!</h2>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xs">
                            The official platform for Kyokushin Karate Foundation of India. Dedicated to the preservation and promotion of the ultimate truth.
                        </p>
                        {/* Belt‑colored decorative bar */}
                        <div className="flex gap-1">
                            {["bg-white", "bg-orange-400", "bg-blue-500", "bg-yellow-400", "bg-green-500", "bg-amber-700", "bg-black border border-white/20"].map((c, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${c}`} />
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div variants={fadeUp}>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-3 sm:mb-4 md:mb-6">Quick Links</h3>
                        <ul className="space-y-2 sm:space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            {[
                                { href: "/dojos", label: "Find a Dojo" },
                                { href: "/events", label: "Upcoming Events" },
                                { href: "/gallery", label: "Photo Gallery" },
                                { href: "/syllabus", label: "Training Syllabus" },
                                { href: "/calendar", label: "Calendar" },
                                { href: "/contact", label: "Contact" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="hover:text-red-500 transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center group">
                                        <span className="w-0 group-hover:w-3 h-px bg-red-500 mr-0 group-hover:mr-2 transition-all duration-300" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Legal */}
                    <motion.div variants={fadeUp} className="hidden sm:block">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-3 sm:mb-4 md:mb-6">Legal</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li><Link href="/privacy" className="hover:text-red-500 transition-colors group flex items-center"><span className="w-0 group-hover:w-3 h-px bg-red-500 mr-0 group-hover:mr-2 transition-all duration-300" />Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-red-500 transition-colors group flex items-center"><span className="w-0 group-hover:w-3 h-px bg-red-500 mr-0 group-hover:mr-2 transition-all duration-300" />Terms of Service</Link></li>
                            <li><span className="text-gray-600">Tournament Rules</span></li>
                            <li><span className="text-gray-600">Membership Terms</span></li>
                        </ul>
                    </motion.div>

                    {/* Contact */}
                    <motion.div variants={fadeUp} className="col-span-1 sm:col-span-2 lg:col-span-1">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-4 md:mb-6">Contact Us</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0 mt-1" />
                                <a
                                    href="https://maps.app.goo.gl/o8ttnRaNuRAPqA3H9"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-red-500 transition-colors break-words group"
                                >
                                    Shuklaganj Bypass Rd, Poni Road, Shuklaganj, Netua Grameen, Uttar Pradesh 209861, India
                                    <ExternalLink className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0" />
                                <a href="tel:+919956711400" className="hover:text-red-500 transition-colors">+91 99567 11400</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0" />
                                <a href="mailto:contact@kyokushin.in" className="hover:text-red-500 transition-colors break-all">contact@kyokushin.in</a>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                <motion.div variants={fadeUp} className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                    <p className="text-center md:text-left">&copy; {new Date().getFullYear()} Kyokushin Karate Foundation of India. All rights reserved.</p>
                    <p className="text-center md:text-right flex items-center gap-2">
                        Designed with Spirit & Strength
                        <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    </p>
                </motion.div>
            </motion.div>
        </footer>
    );
}
