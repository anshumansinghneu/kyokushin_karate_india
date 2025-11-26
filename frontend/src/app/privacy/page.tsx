"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pointer-events-none" />
            
            <div className="container mx-auto px-4 py-24 relative z-10 max-w-4xl">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-6xl font-black mb-4">
                        Privacy <span className="text-red-500">Policy</span>
                    </h1>
                    <p className="text-gray-400 mb-12">Last updated: November 25, 2025</p>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                            <p>
                                Kyokushin Karate India (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">Personal Information:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Name, email address, phone number</li>
                                <li>Date of birth, height, weight</li>
                                <li>Address (city, state, country)</li>
                                <li>Profile photo</li>
                                <li>Belt rank and training history</li>
                                <li>Guardian information (for minors)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Usage Data:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Login times and activity logs</li>
                                <li>Event registrations and attendance</li>
                                <li>Training session records</li>
                                <li>IP address and device information</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
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
                            <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing and Disclosure</h2>
                            <p className="mb-4">We do not sell your personal information. We may share your data with:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Your assigned dojo and instructors</li>
                                <li>Event organizers (for tournament registration)</li>
                                <li>Payment processors (for membership fees)</li>
                                <li>Law enforcement (if legally required)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
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
                            <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
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
                            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
                            <p>
                                We use cookies and similar technologies to enhance your experience, maintain your login session, and analyze platform usage. You can control cookie preferences in your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">8. Children&apos;s Privacy</h2>
                            <p>
                                Our platform is used by martial arts students of all ages. For users under 18, we require guardian information and consent. We take extra precautions to protect minors&apos; data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
                            <p>
                                We may update this privacy policy from time to time. We will notify you of any significant changes via email or platform notification.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                            <p>
                                If you have questions about this privacy policy or wish to exercise your rights, please contact us at:
                            </p>
                            <div className="mt-4 p-4 bg-zinc-900/50 border border-white/10 rounded-lg">
                                <p>Email: privacy@kyokushinkarateindia.org</p>
                                <p>Phone: +91 XXX XXX XXXX</p>
                                <p>Address: [Your Organization Address]</p>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
