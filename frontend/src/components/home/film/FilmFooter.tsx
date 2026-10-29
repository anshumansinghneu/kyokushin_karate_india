import Link from "next/link";
import { focusRing } from "./ui";

const link = `inline-flex min-h-11 items-center text-ash underline decoration-transparent underline-offset-[6px] transition-colors duration-500 ease-dojo hover:text-canvas hover:decoration-dan-gold ${focusRing}`;
const heading = "font-gothic font-bold text-canvas";

const quickLinks = [
    { href: "/find-a-dojo", label: "Find a dojo" },
    { href: "/events", label: "Upcoming events" },
    { href: "/gallery", label: "Photo gallery" },
    { href: "/syllabus", label: "Training syllabus" },
    { href: "/belt-system", label: "Belt system" },
    { href: "/what-is-kyokushin", label: "What is Kyokushin?" },
    { href: "/calendar", label: "Calendar" },
    { href: "/contact", label: "Contact" },
];

/** The public site's footer, in the dojo system. The member app keeps the shared Footer. */
export default function FilmFooter({ cities = [] }: { cities?: { city: string; slug: string }[] }) {
    return (
        <footer className="relative z-50 border-t border-worn-belt bg-night px-4 pb-28 pt-16 font-gothic md:px-10 md:pb-10 md:pt-20">
            <div className="mx-auto grid max-w-[1400px] gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
                <div>
                    <p className="flex items-start gap-4">
                        <span aria-hidden="true" lang="ja" className="font-mincho text-[1.953rem] font-extrabold leading-none text-canvas [writing-mode:vertical-rl]">
                            押忍
                        </span>
                        <span className="font-mincho text-[1.953rem] font-extrabold leading-none text-canvas">Osu.</span>
                    </p>
                    <p className="mt-6 max-w-[34ch] leading-[1.6] text-ash">
                        The official platform for Kyokushin Karate Foundation of India. Dedicated to the preservation and promotion of the ultimate truth.
                    </p>
                </div>

                <nav aria-labelledby="footer-quick">
                    <h2 id="footer-quick" className={heading}>Quick links</h2>
                    <ul className="mt-4">
                        {quickLinks.map((l) => (
                            <li key={l.href}>
                                <Link href={l.href} className={link}>{l.label}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-labelledby="footer-legal">
                    <h2 id="footer-legal" className={heading}>Legal</h2>
                    <ul className="mt-4">
                        <li><Link href="/privacy" className={link}>Privacy policy</Link></li>
                        <li><Link href="/terms" className={link}>Terms of service</Link></li>
                        <li className="flex min-h-11 items-center text-ash">Tournament rules</li>
                        <li className="flex min-h-11 items-center text-ash">Membership terms</li>
                    </ul>
                </nav>

                <div>
                    <h2 className={heading}>Contact us</h2>
                    <ul className="mt-4 space-y-1">
                        <li>
                            <a href="https://maps.app.goo.gl/o8ttnRaNuRAPqA3H9" target="_blank" rel="noopener noreferrer" className={`${link} py-2`}>
                                Shuklaganj Bypass Rd, Poni Road, Shuklaganj, Netua Grameen, Uttar Pradesh 209861, India
                            </a>
                        </li>
                        <li><a href="tel:+919956745114" className={link}>+91 99567 45114</a></li>
                        <li><a href="mailto:contact@kyokushin.in" className={link}>contact@kyokushin.in</a></li>
                    </ul>
                </div>
            </div>

            {cities.length > 0 && (
                <nav aria-labelledby="footer-cities" className="mx-auto mt-14 max-w-[1400px] border-t border-worn-belt pt-8">
                    <h2 id="footer-cities" className={heading}>Kyokushin karate classes near you</h2>
                    <ul className="mt-3 flex flex-wrap gap-x-6">
                        {cities.map((c) => (
                            <li key={c.slug}>
                                <Link href={`/karate/${c.slug}`} className={link}>Karate in {c.city}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            <div className="mx-auto mt-14 flex max-w-[1400px] flex-col gap-3 border-t border-worn-belt pt-8 text-[0.8rem] text-ash md:flex-row md:justify-between">
                <p>&copy; {new Date().getFullYear()} Kyokushin Karate Foundation of India. All rights reserved.</p>
                <p>Some imagery on this site is illustrative. People, dojos and events shown as KKFI are real.</p>
            </div>
        </footer>
    );
}
