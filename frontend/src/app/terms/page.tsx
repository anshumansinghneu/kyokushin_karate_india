import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Long-form legal reading: a readable measure, numbered sections (the document is numbered), and a contents list on wide screens. */
export default function TermsPage() {
    return (
        <div className="min-h-screen w-full bg-black text-white selection:bg-primary selection:text-white">
            <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to home
                </Link>

                <header className="mt-10 max-w-[44rem] border-b border-white/10 pb-10">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                        Terms of service<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-white/75">The rules for using the KKFI platform: accounts, roles, gradings, events, payments and conduct.</p>
                    <p className="mt-4 text-sm font-semibold text-white/55">Last updated: November 25, 2025</p>
                </header>

                <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
                    <nav aria-label="Contents" className="hidden lg:block">
                        <div className="sticky top-32">
                            <p className="mb-3 text-sm font-semibold text-white/55">Contents</p>
                            <ol className="text-sm">
                                <li><a href="#section-1" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">1</span>Acceptance of Terms</a></li>
                                <li><a href="#section-2" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">2</span>User Accounts</a></li>
                                <li><a href="#section-3" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">3</span>User Roles and Responsibilities</a></li>
                                <li><a href="#section-4" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">4</span>Belt Promotion Policy</a></li>
                                <li><a href="#section-5" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">5</span>Event Registration and Payments</a></li>
                                <li><a href="#section-6" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">6</span>Code of Conduct</a></li>
                                <li><a href="#section-7" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">7</span>Content Ownership</a></li>
                                <li><a href="#section-8" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">8</span>Liability and Disclaimers</a></li>
                                <li><a href="#section-9" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">9</span>Termination</a></li>
                                <li><a href="#section-10" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">10</span>Dispute Resolution</a></li>
                                <li><a href="#section-11" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">11</span>Modifications to Terms</a></li>
                                <li><a href="#section-12" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">12</span>Governing Law</a></li>
                                <li><a href="#section-13" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">13</span>Contact Information</a></li>
                            </ol>
                        </div>
                    </nav>

                    <article className="max-w-[70ch] space-y-10 text-[1.0625rem] leading-[1.75] text-white/80">
                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-1" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">1.</span>Acceptance of Terms</h2>
                            <p>
                                By accessing and using the Kyokushin Karate Foundation of India platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-2" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">2.</span>User Accounts</h2>
                            <h3 className="mb-2 mt-5 font-bold text-white">Account Creation:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>You must provide accurate and complete information</li>
                                <li>You are responsible for maintaining account security</li>
                                <li>You must be at least 13 years old (with guardian consent)</li>
                                <li>One person may not maintain multiple accounts</li>
                            </ul>

                            <h3 className="mb-2 mt-6 font-bold text-white">Account Security:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Keep your password confidential</li>
                                <li>Notify us immediately of unauthorized access</li>
                                <li>You are responsible for all activities under your account</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-3" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">3.</span>User Roles and Responsibilities</h2>

                            <h3 className="mb-2 mt-5 font-bold text-white">Students:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Maintain accurate profile information</li>
                                <li>Follow dojo rules and instructor guidance</li>
                                <li>Respect other members and instructors</li>
                                <li>Pay membership fees on time</li>
                            </ul>

                            <h3 className="mb-2 mt-6 font-bold text-white">Instructors:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Maintain professional conduct</li>
                                <li>Accurately record student progress</li>
                                <li>Follow belt promotion guidelines</li>
                                <li>Protect student privacy</li>
                            </ul>

                            <h3 className="mb-2 mt-6 font-bold text-white">Admins:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Manage platform responsibly</li>
                                <li>Approve instructor applications</li>
                                <li>Resolve disputes fairly</li>
                                <li>Maintain platform integrity</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-4" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">4.</span>Belt Promotion Policy</h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Students must wait 6 months between promotions</li>
                                <li>Instructors can only promote to ranks below their own</li>
                                <li>Belt promotions require demonstration of skill</li>
                                <li>Promotion history is permanent and cannot be deleted</li>
                                <li>Belt fraud or misrepresentation may result in account termination</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-5" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">5.</span>Event Registration and Payments</h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Event registrations are binding once confirmed</li>
                                <li>Registration fees are non-refundable unless event is cancelled</li>
                                <li>You must meet event eligibility requirements</li>
                                <li>Late registrations may incur additional fees</li>
                                <li>Medical clearance may be required for tournaments</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-6" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">6.</span>Code of Conduct</h2>
                            <p className="mb-4">Users must not:</p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Harass, threaten, or abuse other users</li>
                                <li>Upload inappropriate or offensive content</li>
                                <li>Misrepresent belt ranks or qualifications</li>
                                <li>Share account credentials</li>
                                <li>Attempt to hack or compromise the platform</li>
                                <li>Spam or send unsolicited messages</li>
                                <li>Violate intellectual property rights</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-7" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">7.</span>Content Ownership</h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>You retain ownership of content you upload</li>
                                <li>You grant us license to display your content on the platform</li>
                                <li>We reserve the right to remove inappropriate content</li>
                                <li>Platform design and features are our intellectual property</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-8" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">8.</span>Liability and Disclaimers</h2>
                            <p className="mb-4 font-semibold text-white">IMPORTANT: Martial Arts involves physical risk</p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>We are not liable for injuries during training or events</li>
                                <li>Participants assume all risks of martial arts activity</li>
                                <li>The platform is provided &quot;as is&quot; without warranties</li>
                                <li>We are not responsible for instructor conduct outside the platform</li>
                                <li>We do not guarantee continuous platform availability</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-9" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">9.</span>Termination</h2>
                            <p className="mb-4">We may suspend or terminate your account if you:</p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Violate these Terms of Service</li>
                                <li>Engage in fraudulent activity</li>
                                <li>Fail to pay membership fees</li>
                                <li>Harm the platform or other users</li>
                            </ul>
                            <p className="mt-4">You may delete your account at any time through account settings.</p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-10" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">10.</span>Dispute Resolution</h2>
                            <p>
                                Any disputes arising from these terms will be resolved through:
                            </p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>First: Direct communication with platform support</li>
                                <li>Then: Mediation by Kyokushin Karate Foundation of India leadership</li>
                                <li>Finally: Arbitration under Indian law</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-11" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">11.</span>Modifications to Terms</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Significant changes will be announced via email and platform notification. Continued use of the platform after changes constitutes acceptance of new terms.
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-12" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">12.</span>Governing Law</h2>
                            <p>
                                These terms are governed by the laws of India. Any legal action must be brought in the courts of [Your Jurisdiction].
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-13" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">13.</span>Contact Information</h2>
                            <p>
                                For questions about these terms, contact:
                            </p>
                            <div className="mt-5 space-y-1 border-y border-white/10 py-5">
                                <p>Email: contact@kyokushin.in</p>
                                <p>Phone: +91 99567 45114</p>
                                <p>Address: Shuklaganj Bypass Rd, Poni Road, Shuklaganj, Netua Grameen, Uttar Pradesh 209861, India</p>
                            </div>
                        </section>

                        <div className="mt-4 rounded-xl border border-white/15 p-6">
                            <p className="mb-2 font-bold text-white">Important notice</p>
                            <p>
                                By clicking &quot;I Agree&quot; during registration, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}
