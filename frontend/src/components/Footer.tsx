import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, ExternalLink } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 pt-12 md:pt-16 pb-6 md:pb-8 relative z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
                    {/* Brand */}
                    <div className="space-y-4 sm:space-y-6 col-span-1 sm:col-span-2 lg:col-span-1">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white italic">OSU!</h2>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xs">
                            The official platform for Kyokushin Karate Foundation of India. Dedicated to the preservation and promotion of the ultimate truth.
                        </p>
                        <div className="flex gap-3 md:gap-4">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-4 md:mb-6">Quick Links</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/dojos" className="hover:text-primary transition-colors">Find a Dojo</Link></li>
                            <li><Link href="/events" className="hover:text-primary transition-colors">Upcoming Events</Link></li>
                            <li><Link href="/gallery" className="hover:text-primary transition-colors">Photo Gallery</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-4 md:mb-6">Legal</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/rules" className="hover:text-primary transition-colors">Tournament Rules</Link></li>
                            <li><Link href="/membership" className="hover:text-primary transition-colors">Membership Terms</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-4 md:mb-6">Contact Us</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-1" />
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Shuklaganj+Bypass+Rd,+Poni+Road,+Shuklaganj,+Netua+Grameen,+Uttar+Pradesh+209861,+India"
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
