import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, ExternalLink } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 pt-8 sm:pt-12 md:pt-16 pb-24 md:pb-8 relative z-50">
            <div className="container mx-auto px-3 sm:px-4 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12 md:mb-16">
                    {/* Brand */}
                    <div className="space-y-4 sm:space-y-6 col-span-1 sm:col-span-2 lg:col-span-1">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white italic">OSU!</h2>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xs">
                            The official platform for Kyokushin Karate Foundation of India. Dedicated to the preservation and promotion of the ultimate truth.
                        </p>
                        <div className="flex gap-4">
                            <span className="text-gray-400 hover:text-primary transition-colors p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-default opacity-40" title="Coming soon"><Facebook className="w-5 h-5" /></span>
                            <span className="text-gray-400 hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-default opacity-40" title="Coming soon"><Instagram className="w-5 h-5" /></span>
                            <span className="text-gray-400 hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-default opacity-40" title="Coming soon"><Twitter className="w-5 h-5" /></span>
                            <span className="text-gray-400 hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-default opacity-40" title="Coming soon"><Youtube className="w-5 h-5" /></span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-3 sm:mb-4 md:mb-6">Quick Links</h3>
                        <ul className="space-y-2 sm:space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li><Link href="/about" className="hover:text-primary transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center">About Us</Link></li>
                            <li><Link href="/dojos" className="hover:text-primary transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center">Find a Dojo</Link></li>
                            <li><Link href="/events" className="hover:text-primary transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center">Upcoming Events</Link></li>
                            <li><Link href="/gallery" className="hover:text-primary transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center">Photo Gallery</Link></li>
                            <li className="hidden sm:block"><Link href="/syllabus" className="hover:text-primary transition-colors">Training Syllabus</Link></li>
                            <li className="hidden sm:block"><Link href="/calendar" className="hover:text-primary transition-colors">Calendar</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors py-1 min-h-[44px] sm:min-h-0 flex items-center">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal - hidden on small mobile, visible on sm+ */}
                    <div className="hidden sm:block">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-3 sm:mb-4 md:mb-6">Legal</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><span className="text-gray-500 cursor-default">Tournament Rules</span></li>
                            <li><span className="text-gray-500 cursor-default">Membership Terms</span></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-4 md:mb-6">Contact Us</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-1" />
                                <a
                                    href="https://maps.app.goo.gl/o8ttnRaNuRAPqA3H9"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors break-words group"
                                >
                                    Shuklaganj Bypass Rd, Poni Road, Shuklaganj, Netua Grameen, Uttar Pradesh 209861, India
                                    <ExternalLink className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                                <a href="tel:+919956711400" className="hover:text-primary transition-colors">+91 99567 11400</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                                <a href="mailto:contact@kyokushin.in" className="hover:text-primary transition-colors break-all">contact@kyokushin.in</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                    <p className="text-center md:text-left">&copy; {new Date().getFullYear()} Kyokushin Karate Foundation of India. All rights reserved.</p>
                    <p className="text-center md:text-right">Designed with Spirit & Strength.</p>
                </div>
            </div>
        </footer>
    );
}
