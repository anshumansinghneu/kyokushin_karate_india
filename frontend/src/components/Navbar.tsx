"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

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

    const navLinks = [
        { name: "Dojos", href: "/dojos" },
        { name: "Events", href: "/events" },
        { name: "Sponsors", href: "/sponsors" },
        { name: "Low Kick", href: "/low-kick", icon: "/india-flag.png" },
        // { name: "Gallery", href: "/gallery" }, // TODO: Implement Gallery
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-md py-4 border-b border-white/10" : "bg-transparent py-6"
                }`}
        >
            <div className="container mx-auto px-4 flex justify-between items-center">
                {/* Brand */}
                <Link href="/" className="text-2xl font-black tracking-tighter text-white italic z-50">
                    KKI
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${pathname === link.href ? "text-primary" : "text-gray-300 hover:text-white"
                                }`}
                        >
                            {link.name}
                            {link.icon && <img src={link.icon} alt="Flag" className="h-4 w-auto rounded-sm" />}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4 ml-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5">
                                    Dashboard
                                </Button>
                            </Link>
                            {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                <Link href="/management">
                                    <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5">
                                        Management
                                    </Button>
                                </Link>
                            )}
                            <Link href="/profile">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
                                    <User className="w-4 h-4" />
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
                                <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-primary hover:bg-primary-dark text-white font-bold rounded-full px-6">
                                    Join Now
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden z-50 text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 md:hidden"
                        >
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-2xl font-bold uppercase tracking-widest text-white hover:text-primary flex items-center gap-3"
                                >
                                    {link.name}
                                    {link.icon && <img src={link.icon} alt="Flag" className="h-6 w-auto rounded-sm" />}
                                </Link>
                            ))}

                            {isAuthenticated ? (
                                <>
                                    <Link href="/dashboard" className="text-2xl font-bold uppercase tracking-widest text-white hover:text-primary">
                                        Dashboard
                                    </Link>
                                    {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                        <Link href="/management" className="text-2xl font-bold uppercase tracking-widest text-white hover:text-primary">
                                            Management
                                        </Link>
                                    )}
                                    <Link href="/profile" className="text-2xl font-bold uppercase tracking-widest text-white hover:text-primary">
                                        Profile
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-xl font-bold uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-2"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-4 mt-4">
                                    <Link href="/login">
                                        <Button variant="ghost" className="text-white text-xl">Login</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button className="bg-primary text-white text-xl px-8 py-6 rounded-full">Join Now</Button>
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
