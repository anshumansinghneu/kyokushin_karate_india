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
            className={`fixed top-0 left-0 right-0 z-50 transition-gpu duration-300 gpu-accelerate ${scrolled ? "bg-black/80 backdrop-blur-md py-4 border-b border-white/10" : "bg-transparent py-4 md:py-6"
                }`}
        >
            <div className="container-responsive flex justify-between items-center">
                {/* Brand */}
                <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter text-white italic z-50 relative">
                    KKI
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
                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary transition-transform hover:scale-105">
                                    <User className="w-4 h-4 lg:w-5 lg:h-5" />
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
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 md:hidden overflow-y-auto py-20 gpu-accelerate will-change-transform will-change-opacity"
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
                                        className="text-xl font-bold uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-2 mt-4"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-4 mt-8 w-full px-10">
                                    <Link href="/login" className="w-full">
                                        <Button variant="outline" className="text-white border-white/20 w-full text-xl py-6 rounded-xl hover:bg-white/10">Login</Button>
                                    </Link>
                                    <Link href="/register" className="w-full">
                                        <Button className="bg-primary text-white text-xl w-full py-6 rounded-xl hover:bg-primary-dark">Join Now</Button>
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
