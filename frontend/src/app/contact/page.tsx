'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';

const GOOGLE_MAPS_QUERY = 'Shuklaganj+Bypass+Rd,+Poni+Road,+Shuklaganj,+Netua+Grameen,+Uttar+Pradesh+209861,+India';
const GOOGLE_MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${GOOGLE_MAPS_QUERY}`;
const GOOGLE_MAPS_EMBED = `https://www.google.com/maps?q=${GOOGLE_MAPS_QUERY}&output=embed`;

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-black pt-24 pb-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tight mb-4">
                        CONTACT <span className="text-primary">US</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Get in touch with Kyokushin Karate Foundation of India. We&apos;d love to hear from you.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Contact Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        {/* Address */}
                        <a
                            href={GOOGLE_MAPS_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-primary/40 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 rounded-lg p-3 shrink-0">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                        Our Location
                                        <ExternalLink className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed">
                                        Shuklaganj Bypass Rd, Poni Road,<br />
                                        Shuklaganj, Netua Grameen,<br />
                                        Uttar Pradesh 209861, India
                                    </p>
                                    <span className="text-primary text-sm mt-2 inline-block group-hover:underline">
                                        Open in Google Maps →
                                    </span>
                                </div>
                            </div>
                        </a>

                        {/* Phone */}
                        <a
                            href="tel:+919956711400"
                            className="group block bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-primary/40 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 rounded-lg p-3 shrink-0">
                                    <Phone className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Phone</h3>
                                    <p className="text-gray-400 text-lg group-hover:text-primary transition-colors">
                                        +91 99567 11400
                                    </p>
                                </div>
                            </div>
                        </a>

                        {/* Email */}
                        <a
                            href="mailto:contact@kyokushin.in"
                            className="group block bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-primary/40 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 rounded-lg p-3 shrink-0">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Email</h3>
                                    <p className="text-gray-400 text-lg group-hover:text-primary transition-colors">
                                        contact@kyokushin.in
                                    </p>
                                </div>
                            </div>
                        </a>

                        {/* Hours */}
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 rounded-lg p-3 shrink-0">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Training Hours</h3>
                                    <div className="text-gray-400 space-y-1">
                                        <p>Monday – Friday: 6:00 AM – 8:00 PM</p>
                                        <p>Saturday: 7:00 AM – 5:00 PM</p>
                                        <p>Sunday: 8:00 AM – 12:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Google Maps Embed */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden h-full min-h-[400px] lg:min-h-0">
                            <iframe
                                src={GOOGLE_MAPS_EMBED}
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '500px' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Kyokushin Karate Foundation of India - Location"
                                className="rounded-xl"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 md:p-12"
                >
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                        BEGIN YOUR <span className="text-primary">JOURNEY</span>
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                        Whether you&apos;re a beginner or an experienced martial artist, Kyokushin welcomes you. Visit us or reach out today.
                    </p>
                    <a
                        href={GOOGLE_MAPS_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-colors"
                    >
                        <MapPin className="w-5 h-5" />
                        Get Directions
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
