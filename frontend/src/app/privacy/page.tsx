"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen w-full bg-[#080808] text-white relative">
            {/* Top accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

            <div className="max-w-3xl mx-auto px-5 pt-24 pb-20 relative z-10">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-10 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                        Privacy <span className="text-red-500">Policy</span>
                    </h1>
                    <p className="text-gray-600 text-sm font-mono mb-14">Last updated: November 25, 2025</p>

                    <div className="space-y-10 text-gray-400 leading-relaxed text-[15px]">
                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">1. Introduction</h2>
                            <p>
                                Kyokushin Karate Foundation of India (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
                            <h3 className="text-base font-semibold text-white mb-2">Personal Information:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Name, email address, phone number</li>
                                <li>Date of birth, height, weight</li>
                                <li>Address (city, state, country)</li>
                                <li>Profile photo</li>
                                <li>Belt rank and training history</li>
                                <li>Guardian information (for minors)</li>
                            </ul>

                            <h3 className="text-base font-semibold text-white mb-2 mt-4">Usage Data:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Login times and activity logs</li>
                                <li>Event registrations and attendance</li>
                                <li>Training session records</li>
                                <li>IP address and device information</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Information</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>To create and manage your account</li>
                                <li>To track your martial arts progression and belt promotions</li>
                                <li>To register you for events and tournaments</li>
                                <li>To communicate important updates and notifications</li>
                                <li>To improve our platform and services</li>
                                <li>To ensure security and prevent fraud</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">4. Data Sharing and Disclosure</h2>
                            <p className="mb-4">We do not sell your personal information. We may share your data with:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Your assigned dojo and instructors</li>
                                <li>Event organizers (for tournament registration)</li>
                                <li>Payment processors (for membership fees)</li>
                                <li>Law enforcement (if legally required)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">5. Data Security</h2>
                            <p>
                                We implement industry-standard security measures including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                <li>Encrypted password storage</li>
                                <li>Secure HTTPS connections</li>
                                <li>Regular security audits</li>
                                <li>Limited access to personal data</li>
                                <li>Rate limiting to prevent brute force attacks</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">6. Your Rights</h2>
                            <p className="mb-4">You have the right to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Access your personal data</li>
                                <li>Correct inaccurate information</li>
                                <li>Request deletion of your account</li>
                                <li>Export your data</li>
                                <li>Opt-out of marketing communications</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">7. Cookies and Tracking</h2>
                            <p>
                                We use cookies and similar technologies to enhance your experience, maintain your login session, and analyze platform usage. You can control cookie preferences in your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">8. Children&apos;s Privacy</h2>
                            <p>
                                Our platform is used by martial arts students of all ages. For users under 18, we require guardian information and consent. We take extra precautions to protect minors&apos; data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">9. Changes to This Policy</h2>
                            <p>
                                We may update this privacy policy from time to time. We will notify you of any significant changes via email or platform notification.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-3">10. Contact Us</h2>
                            <p>
                                If you have questions about this privacy policy or wish to exercise your rights, please contact us at:
                            </p>
                            <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-1 text-sm">
                                <p>Email: contact@kyokushin.in</p>
                                <p>Phone: +91 99567 45114</p>
                                <p>Address: Shuklaganj Bypass Rd, Poni Road, Shuklaganj, Netua Grameen, Uttar Pradesh 209861, India</p>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
