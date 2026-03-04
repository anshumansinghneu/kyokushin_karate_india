'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ExternalLink, Send, Loader2, CheckCircle } from 'lucide-react';

const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/o8ttnRaNuRAPqA3H9';
const GOOGLE_MAPS_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.5!2d80.78!3d26.84!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDUwJzI0LjAiTiA4MMKwNDYnNDguMCJF!5e0!3m2!1sen!2sin!4v1700000000000';

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        await new Promise(r => setTimeout(r, 1500));
        setSending(false);
        setSent(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <div className="min-h-screen bg-[#080808]">
            {/* Top accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

            {/* Hero */}
            <div className="relative pt-28 pb-14 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-600/[0.04] rounded-full blur-[100px]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center max-w-3xl mx-auto px-5"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-gray-400 tracking-wide mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        GET IN TOUCH
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        Contact <span className="text-red-500">KKFI</span>
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                        Get in touch with Kyokushin Karate Foundation of India. We&apos;d love to hear from you.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto px-5 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Contact Info */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        <motion.a
                            variants={fadeUp}
                            href={GOOGLE_MAPS_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-red-500/25 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                                        Our Location
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Shuklaganj Bypass Rd, Poni Road,<br />
                                        Shuklaganj, Netua Grameen,<br />
                                        Uttar Pradesh 209861, India
                                    </p>
                                    <span className="text-red-500/70 text-xs font-semibold mt-2 inline-block group-hover:text-red-400 transition-colors">
                                        Open in Google Maps →
                                    </span>
                                </div>
                            </div>
                        </motion.a>

                        <motion.a
                            variants={fadeUp}
                            href="tel:+919956745114"
                            className="group block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-red-500/25 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-0.5">Phone</h3>
                                    <p className="text-gray-400 font-mono text-sm group-hover:text-white transition-colors">
                                        +91 99567 45114
                                    </p>
                                </div>
                            </div>
                        </motion.a>

                        <motion.a
                            variants={fadeUp}
                            href="mailto:contact@kyokushin.in"
                            className="group block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-red-500/25 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-0.5">Email</h3>
                                    <p className="text-gray-400 text-sm group-hover:text-white transition-colors">
                                        contact@kyokushin.in
                                    </p>
                                </div>
                            </div>
                        </motion.a>

                        <motion.div
                            variants={fadeUp}
                            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">Training Hours</h3>
                                    <div className="text-gray-500 text-sm space-y-1">
                                        <div className="flex justify-between gap-8">
                                            <span>Mon – Fri</span>
                                            <span className="text-gray-400 font-mono text-xs">6:00 AM – 8:00 PM</span>
                                        </div>
                                        <div className="flex justify-between gap-8">
                                            <span>Saturday</span>
                                            <span className="text-gray-400 font-mono text-xs">7:00 AM – 5:00 PM</span>
                                        </div>
                                        <div className="flex justify-between gap-8">
                                            <span>Sunday</span>
                                            <span className="text-gray-400 font-mono text-xs">8:00 AM – 12:00 PM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Map */}
                        <motion.div
                            variants={fadeUp}
                            className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
                        >
                            <iframe
                                src={GOOGLE_MAPS_EMBED}
                                width="100%"
                                height="220"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="KKFI Location"
                                className="rounded-xl"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-lg bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center">
                                    <Send className="w-4 h-4 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Send Us a Message</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5 block">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your name"
                                            className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5 block">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="your@email.com"
                                            className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5 block">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="What is this regarding?"
                                        className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5 block">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Your message..."
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full h-12 rounded-lg bg-white text-black font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-200 disabled:opacity-60 active:scale-[0.98]"
                                >
                                    {sending ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                    ) : sent ? (
                                        <><CheckCircle className="w-4 h-4" /> Message Sent!</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Send Message</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16 text-center"
                >
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                            Begin Your <span className="text-red-500">Journey</span>
                        </h2>
                        <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm">
                            Whether you&apos;re a beginner or an experienced martial artist, Kyokushin welcomes you. Visit us or reach out today.
                        </p>
                        <a
                            href={GOOGLE_MAPS_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-lg text-sm hover:bg-gray-200 transition-colors active:scale-[0.97]"
                        >
                            <MapPin className="w-4 h-4" />
                            Get Directions
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
