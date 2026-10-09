import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SceneSlot from "@/components/three/SceneSlot";

// Stable scene props: 守.
const INK = { kanji: "守", red: 0.15 };

/** Long-form legal reading: a readable measure, numbered sections (the document is numbered), and a contents list on wide screens. */
export default function PrivacyPage() {
    return (
        <div className="min-h-screen w-full text-white selection:bg-primary selection:text-white">
            {/* Hero: ink scene with 守 brushed in; the reading layout below is unchanged. */}
            <header data-bleed className="relative flex min-h-[62svh] overflow-hidden">
                <SceneSlot scene="ink" sceneProps={INK} className="absolute inset-0" fallback={<div className="absolute inset-0 bg-black" />} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/30 md:to-transparent" />
                <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col justify-end px-4 pb-14 pt-36 sm:px-6 md:pt-44 lg:px-8">
                <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to home
                </Link>

                <div className="mt-10 max-w-[44rem]">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                        Privacy policy<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-white/75">How the Kyokushin Karate Foundation of India collects, uses and protects your personal data.</p>
                    <p className="mt-4 text-sm font-semibold text-white/55">Last updated: November 25, 2025</p>
                </div>
                </div>
            </header>
            <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-4 sm:px-6 lg:px-8">

                <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
                    <nav aria-label="Contents" className="hidden lg:block">
                        <div className="sticky top-32">
                            <p className="mb-3 text-sm font-semibold text-white/55">Contents</p>
                            <ol className="text-sm">
                                <li><a href="#section-1" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">1</span>Introduction</a></li>
                                <li><a href="#section-2" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">2</span>Information We Collect</a></li>
                                <li><a href="#section-3" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">3</span>How We Use Your Information</a></li>
                                <li><a href="#section-4" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">4</span>Data Sharing and Disclosure</a></li>
                                <li><a href="#section-5" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">5</span>Data Security</a></li>
                                <li><a href="#section-6" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">6</span>Your Rights</a></li>
                                <li><a href="#section-7" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">7</span>Cookies and Tracking</a></li>
                                <li><a href="#section-8" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">8</span>Children&apos;s Privacy</a></li>
                                <li><a href="#section-9" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">9</span>Changes to This Policy</a></li>
                                <li><a href="#section-10" className="flex min-h-9 items-baseline gap-3 py-1 text-white/65 transition-colors hover:text-white"><span className="w-5 shrink-0 tabular-nums text-white/35">10</span>Contact Us</a></li>
                            </ol>
                        </div>
                    </nav>

                    <article className="max-w-[70ch] space-y-10 text-[1.0625rem] leading-[1.75] text-white/80">
                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-1" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">1.</span>Introduction</h2>
                            <p>
                                Kyokushin Karate Foundation of India (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-2" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">2.</span>Information We Collect</h2>
                            <h3 className="mb-2 mt-5 font-bold text-white">Personal Information:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Name, email address, phone number</li>
                                <li>Date of birth, height, weight</li>
                                <li>Address (city, state, country)</li>
                                <li>Profile photo</li>
                                <li>Belt rank and training history</li>
                                <li>Guardian information (for minors)</li>
                            </ul>

                            <h3 className="mb-2 mt-6 font-bold text-white">Usage Data:</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Login times and activity logs</li>
                                <li>Event registrations and attendance</li>
                                <li>Training session records</li>
                                <li>IP address and device information</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-3" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">3.</span>How We Use Your Information</h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>To create and manage your account</li>
                                <li>To track your martial arts progression and belt promotions</li>
                                <li>To register you for events and tournaments</li>
                                <li>To communicate important updates and notifications</li>
                                <li>To improve our platform and services</li>
                                <li>To ensure security and prevent fraud</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-4" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">4.</span>Data Sharing and Disclosure</h2>
                            <p className="mb-4">We do not sell your personal information. We may share your data with:</p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Your assigned dojo and instructors</li>
                                <li>Event organizers (for tournament registration)</li>
                                <li>Payment processors (for membership fees)</li>
                                <li>Law enforcement (if legally required)</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-5" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">5.</span>Data Security</h2>
                            <p>
                                We implement industry-standard security measures including:
                            </p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Encrypted password storage</li>
                                <li>Secure HTTPS connections</li>
                                <li>Regular security audits</li>
                                <li>Limited access to personal data</li>
                                <li>Rate limiting to prevent brute force attacks</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-6" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">6.</span>Your Rights</h2>
                            <p className="mb-4">You have the right to:</p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-white/40">
                                <li>Access your personal data</li>
                                <li>Correct inaccurate information</li>
                                <li>Request deletion of your account</li>
                                <li>Export your data</li>
                                <li>Opt-out of marketing communications</li>
                            </ul>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-7" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">7.</span>Cookies and Tracking</h2>
                            <p>
                                We use cookies and similar technologies to enhance your experience, maintain your login session, and analyze platform usage. You can control cookie preferences in your browser settings.
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-8" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">8.</span>Children&apos;s Privacy</h2>
                            <p>
                                Our platform is used by martial arts students of all ages. For users under 18, we require guardian information and consent. We take extra precautions to protect minors&apos; data.
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-9" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">9.</span>Changes to This Policy</h2>
                            <p>
                                We may update this privacy policy from time to time. We will notify you of any significant changes via email or platform notification.
                            </p>
                        </section>

                        <section className="border-t border-white/10 pt-10 first:border-t-0 first:pt-0">
                            <h2 id="section-10" className="scroll-mt-32 text-xl font-extrabold text-white md:text-2xl"><span className="mr-3 tabular-nums text-white/40">10.</span>Contact Us</h2>
                            <p>
                                If you have questions about this privacy policy or wish to exercise your rights, please contact us at:
                            </p>
                            <div className="mt-5 space-y-1 border-y border-white/10 py-5">
                                <p>Email: contact@kyokushin.in</p>
                                <p>Phone: +91 99567 45114</p>
                                <p>Address: Shuklaganj Bypass Rd, Poni Road, Shuklaganj, Netua Grameen, Uttar Pradesh 209861, India</p>
                            </div>
                        </section>
                    </article>
                </div>
            </div>
        </div>
    );
}
