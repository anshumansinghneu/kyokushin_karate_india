"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                        Terms of <span className="text-red-500">Service</span>
                    </h1>
                    <p className="text-gray-400 mb-12">Last updated: November 25, 2025</p>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using the Kyokushin Karate Foundation of India platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">Account Creation:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You must provide accurate and complete information</li>
                                <li>You are responsible for maintaining account security</li>
                                <li>You must be at least 13 years old (with guardian consent)</li>
                                <li>One person may not maintain multiple accounts</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Account Security:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Keep your password confidential</li>
                                <li>Notify us immediately of unauthorized access</li>
                                <li>You are responsible for all activities under your account</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. User Roles and Responsibilities</h2>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">Students:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Maintain accurate profile information</li>
                                <li>Follow dojo rules and instructor guidance</li>
                                <li>Respect other members and instructors</li>
                                <li>Pay membership fees on time</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Instructors:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Maintain professional conduct</li>
                                <li>Accurately record student progress</li>
                                <li>Follow belt promotion guidelines</li>
                                <li>Protect student privacy</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Admins:</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Manage platform responsibly</li>
                                <li>Approve instructor applications</li>
                                <li>Resolve disputes fairly</li>
                                <li>Maintain platform integrity</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Belt Promotion Policy</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Students must wait 6 months between promotions</li>
                                <li>Instructors can only promote to ranks below their own</li>
                                <li>Belt promotions require demonstration of skill</li>
                                <li>Promotion history is permanent and cannot be deleted</li>
                                <li>Belt fraud or misrepresentation may result in account termination</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Event Registration and Payments</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Event registrations are binding once confirmed</li>
                                <li>Registration fees are non-refundable unless event is cancelled</li>
                                <li>You must meet event eligibility requirements</li>
                                <li>Late registrations may incur additional fees</li>
                                <li>Medical clearance may be required for tournaments</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Code of Conduct</h2>
                            <p className="mb-4">Users must not:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Harass, threaten, or abuse other users</li>
                                <li>Upload inappropriate or offensive content</li>
                                <li>Misrepresent belt ranks or qualifications</li>
                                <li>Share account credentials</li>
                                <li>Attempt to hack or compromise the platform</li>
                                <li>Spam or send unsolicited messages</li>
                                <li>Violate intellectual property rights</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">7. Content Ownership</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You retain ownership of content you upload</li>
                                <li>You grant us license to display your content on the platform</li>
                                <li>We reserve the right to remove inappropriate content</li>
                                <li>Platform design and features are our intellectual property</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">8. Liability and Disclaimers</h2>
                            <p className="mb-4 font-semibold text-white">IMPORTANT: Martial Arts involves physical risk</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>We are not liable for injuries during training or events</li>
                                <li>Participants assume all risks of martial arts activity</li>
                                <li>The platform is provided &quot;as is&quot; without warranties</li>
                                <li>We are not responsible for instructor conduct outside the platform</li>
                                <li>We do not guarantee continuous platform availability</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
                            <p className="mb-4">We may suspend or terminate your account if you:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Violate these Terms of Service</li>
                                <li>Engage in fraudulent activity</li>
                                <li>Fail to pay membership fees</li>
                                <li>Harm the platform or other users</li>
                            </ul>
                            <p className="mt-4">You may delete your account at any time through account settings.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">10. Dispute Resolution</h2>
                            <p>
                                Any disputes arising from these terms will be resolved through:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                <li>First: Direct communication with platform support</li>
                                <li>Then: Mediation by Kyokushin Karate Foundation of India leadership</li>
                                <li>Finally: Arbitration under Indian law</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">11. Modifications to Terms</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Significant changes will be announced via email and platform notification. Continued use of the platform after changes constitutes acceptance of new terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
                            <p>
                                These terms are governed by the laws of India. Any legal action must be brought in the courts of [Your Jurisdiction].
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
                            <p>
                                For questions about these terms, contact:
                            </p>
                            <div className="mt-4 p-4 bg-zinc-900/50 border border-white/10 rounded-lg">
                                <p>Email: legal@kyokushinkarateindia.org</p>
                                <p>Phone: +91 XXX XXX XXXX</p>
                                <p>Address: [Your Organization Address]</p>
                            </div>
                        </section>

                        <div className="mt-12 p-6 bg-red-950/20 border border-red-600/20 rounded-lg">
                            <p className="font-semibold text-white mb-2">⚠️ Important Notice:</p>
                            <p className="text-sm">
                                By clicking &quot;I Agree&quot; during registration, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
