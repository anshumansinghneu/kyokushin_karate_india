"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function LeadershipSection() {
    return (
        <section className="py-32 bg-zinc-950 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("/noise.png")' }} />

            {/* Red Glow Effect */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* DAIHYO RYUKO TAKE SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                    {/* Content Column (Left for Ryuko Take) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="order-2 lg:order-1"
                    >
                        <div className="mb-8">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                                THE <span className="text-red-600">PRESIDENT</span>
                            </h2>
                            <div className="w-20 h-1 bg-red-600" />
                        </div>

                        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                            <p>
                                <span className="text-white font-bold">Daihyo Ryuko Take</span>, born in Kagoshima Prefecture, entered the Honbu Dojo at 18 and trained directly under <span className="text-white">Sosai Masutatsu Oyama</span>.
                            </p>
                            <p>
                                He is renowned for his powerful <span className="text-red-500 italic">Tsuki</span> (punch) and <span className="text-red-500 italic">Gedan</span> (lower kick). In 1981, Take established a branch dojo in Kagoshima Prefecture, which has grown to 59 dojos in the region.
                            </p>

                            <div className="relative pl-8 border-l-2 border-red-600/30 py-2 my-8">
                                <Quote className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-600 bg-zinc-950 p-1" />
                                <p className="italic text-gray-400">
                                    "He currently serves as the President of the International Karate Organization World Kyokushin Kaikan and holds the rank of 8th Dan."
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Image Column (Right for Ryuko Take) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative order-1 lg:order-2"
                    >
                        <div className="aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden relative group border border-white/10 hover:border-red-600/50 transition-colors duration-500">
                            {/* Ryuko Take's Image with Blending */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
                            <img
                                src="/ryuko-take.png"
                                alt="Daihyo Ryuko Take"
                                className="w-full h-full object-cover object-top grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110"
                            />

                            {/* Overlay Details */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                                <div className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider mb-4">
                                    President (8th Dan)
                                </div>
                                <h3 className="text-3xl font-black text-white leading-tight mb-1">
                                    DAIHYO RYUKO TAKE
                                </h3>
                                <p className="text-gray-400 text-sm uppercase tracking-widest">
                                    IKO World Kyokushin Kaikan
                                </p>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -z-10 top-10 -right-10 w-full h-full border border-red-600/20 rounded-2xl" />
                    </motion.div>
                </div>

                {/* SHIHAN VASANT K. SINGH SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Image Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden relative group border border-white/10 hover:border-red-600/50 transition-colors duration-500">
                            {/* Shihan's Image with Blending */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
                            <img
                                src="/shihan-vasant.png"
                                alt="Shihan Vasant K. Singh"
                                className="w-full h-full object-cover object-top grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110"
                            />

                            {/* Overlay Details */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                                <div className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider mb-4">
                                    Country Director
                                </div>
                                <h3 className="text-3xl font-black text-white leading-tight mb-1">
                                    SHIHAN VASANT K. SINGH
                                </h3>
                                <p className="text-gray-400 text-sm uppercase tracking-widest">
                                    IKO World Kyokushin Kaikan
                                </p>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -z-10 top-10 -left-10 w-full h-full border border-red-600/20 rounded-2xl" />
                        <div className="absolute -z-20 -bottom-10 -right-10 w-40 h-40 bg-red-600/10 blur-3xl rounded-full" />
                    </motion.div>

                    {/* Content Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="mb-8">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                                THE <span className="text-red-600">VISIONARY</span>
                            </h2>
                            <div className="w-20 h-1 bg-red-600" />
                        </div>

                        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                            <p>
                                <span className="text-white font-bold">Shihan Vasant Kumar Singh</span> began his journey in Kyokushin Karate in 1987. His dedication and passion for the martial art led him to make significant efforts to uplift and propagate Kyokushin Karate in India.
                            </p>

                            <div className="relative pl-8 border-l-2 border-red-600/30 py-2 my-8">
                                <Quote className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-600 bg-zinc-950 p-1" />
                                <p className="italic text-gray-400">
                                    "Recognizing the potential and the need for Kyokushin Karate in India, he laid the cornerstone and started The Kyokushin Karate Foundation of India in 2013."
                                </p>
                            </div>

                            <p>
                                Today, under his leadership, the foundation has grown to include <span className="text-white font-bold border-b border-red-600">more than 100 dojos</span> across India, fostering a new generation of strong spirits and disciplined minds.
                            </p>
                        </div>

                        {/* Signature / Stamp Effect (Optional aesthetic touch) */}
                        <div className="mt-12 opacity-50">
                            <div className="w-32 h-12 border-2 border-red-600/50 rounded flex items-center justify-center -rotate-6">
                                <span className="text-red-600 font-black uppercase tracking-widest text-xs">OFFICIAL</span>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
