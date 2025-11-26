"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { getUserProfileImage } from "@/lib/imageUtils";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { user, logout, isAuthenticated, checkAuth } = useAuthStore();

    // Check auth status on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    const navLinks = [
        { name: "Dojos", href: "/dojos" },
        { name: "Events", href: "/events" },
        { name: "Sponsors", href: "/sponsors" },
        { name: "Low Kick", href: "/low-kick", icon: "/india-flag.png" },
        // { name: "Gallery", href: "/gallery" }, // TODO: Implement Gallery
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-gpu duration-300 gpu-accelerate ${scrolled ? "bg-black/80 backdrop-blur-md py-4 border-b border-white/10" : "bg-transparent py-4 md:py-6"
                }`}
        >
            <div className="container-responsive flex justify-between items-center">
                {/* Brand */}
                <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter z-50 relative">
                    <span className="bg-gradient-to-r from-orange-500 via-white to-green-500 bg-clip-text text-transparent italic">KKFI</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-xs lg:text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${pathname === link.href ? "text-primary" : "text-gray-300 hover:text-white"
                                }`}
                        >
                            {link.name}
                            {link.icon && <img src={link.icon} alt="Flag" className="h-4 w-auto rounded-sm" />}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4 ml-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5 text-xs lg:text-sm">
                                    Dashboard
                                </Button>
                            </Link>
                            {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                <Link href="/management">
                                    <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5 text-xs lg:text-sm">
                                        Management
                                    </Button>
                                </Link>
                            )}
                            <Link href="/profile">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary transition-transform hover:scale-105 overflow-hidden">
                                    {getUserProfileImage(user) ? (
                                        <img
                                            key={user?.profilePhotoUrl}
                                            src={getUserProfileImage(user)!}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to user icon if image fails to load
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent && !parent.querySelector('svg')) {
                                                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                                    icon.setAttribute('class', 'w-4 h-4 lg:w-5 lg:h-5');
                                                    icon.setAttribute('viewBox', '0 0 24 24');
                                                    icon.setAttribute('fill', 'none');
                                                    icon.setAttribute('stroke', 'currentColor');
                                                    icon.setAttribute('stroke-width', '2');
                                                    icon.innerHTML = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>';
                                                    parent.appendChild(icon);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <User className="w-4 h-4 lg:w-5 lg:h-5" />
                                    )}
                                </div>
                            </Link>
                            <Button
                                variant="ghost"
                                className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 w-10 h-10 p-0"
                                onClick={logout}
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 ml-4">
                            <Link href="/login">
                                <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5 text-xs lg:text-sm">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-primary hover:bg-primary-dark text-white font-bold rounded-full px-6 text-xs lg:text-sm">
                                    Join Now
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden z-50 text-white p-2"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: "100%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-black via-black to-zinc-900 z-40 flex flex-col items-center justify-start gap-6 md:hidden overflow-y-auto pt-24 pb-8 px-6 safe-area-inset"
                            style={{ touchAction: 'pan-y' }}
                        >
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="w-full"
                                >
                                    <Link
                                        href={link.href}
                                        className="flex items-center justify-between text-xl font-bold uppercase tracking-wider text-white hover:text-primary active:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-white/5 active:bg-white/10"
                                    >
                                        <span>{link.name}</span>
                                        {link.icon && <img src={link.icon} alt="Flag" className="h-5 w-auto rounded-sm" />}
                                    </Link>
                                </motion.div>
                            ))}

                            {isAuthenticated ? (
                                <div className="w-full space-y-2 mt-4 border-t border-white/10 pt-6">
                                    <Link href="/dashboard" className="block text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                        Dashboard
                                    </Link>
                                    {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                        <Link href="/management" className="block text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                            Management
                                        </Link>
                                    )}
                                    <Link href="/profile" className="block text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                        Profile
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left text-lg font-bold uppercase tracking-wider text-red-500 hover:text-red-400 py-3 px-4 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-3 mt-4"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 mt-8 w-full border-t border-white/10 pt-6">
                                    <Link href="/login" className="w-full">
                                        <Button variant="outline" className="text-white border-white/20 w-full text-lg py-6 rounded-xl hover:bg-white/10 active:scale-95 transition-transform">Login</Button>
                                    </Link>
                                    <Link href="/register" className="w-full">
                                        <Button className="bg-primary text-white text-lg w-full py-6 rounded-xl hover:bg-primary-dark active:scale-95 transition-transform">Join Now</Button>
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
