"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Settings, UserCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { getUserProfileImage } from "@/lib/imageUtils";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();
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
        setDropdownOpen(false);
    }, [pathname]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        { name: "Gallery", href: "/gallery" },
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
                        <div className="relative ml-4" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all group"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary overflow-hidden flex-shrink-0">
                                    {getUserProfileImage(user) ? (
                                        <img
                                            key={user?.profilePhotoUrl}
                                            src={getUserProfileImage(user)!}
                                            alt={user?.name || 'User'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <User className="w-3.5 h-3.5" />
                                    )}
                                </div>
                                <span className="text-xs lg:text-sm font-semibold text-white group-hover:text-primary transition-colors max-w-[120px] truncate">
                                    {user?.name?.split(' ')[0] || 'Account'}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                Dashboard
                                            </Link>
                                            {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                                <Link
                                                    href="/management"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Management
                                                </Link>
                                            )}
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <UserCircle className="w-4 h-4" />
                                                Profile
                                            </Link>
                                        </div>
                                        <div className="border-t border-white/10 py-1">
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setDropdownOpen(false);
                                                    router.push('/');
                                                }}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                            className="fixed inset-0 bg-black z-40 flex flex-col md:hidden overflow-y-auto"
                            style={{ touchAction: 'pan-y' }}
                        >
                            {/* Spacer for navbar height */}
                            <div className="pt-20 px-6 pb-8 flex flex-col gap-2">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                    >
                                        <Link
                                            href={link.href}
                                            className="flex items-center justify-between text-xl font-bold uppercase tracking-wider text-white hover:text-primary active:text-primary transition-colors py-4 px-4 rounded-lg hover:bg-white/5 active:bg-white/10 border-b border-white/5"
                                        >
                                            <span>{link.name}</span>
                                            {link.icon && <img src={link.icon} alt="Flag" className="h-5 w-auto rounded-sm" />}
                                        </Link>
                                    </motion.div>
                                ))}

                            {isAuthenticated ? (
                                <div className="w-full space-y-2 mt-4 border-t border-white/10 pt-6">
                                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary overflow-hidden flex-shrink-0">
                                            {getUserProfileImage(user) ? (
                                                <img src={getUserProfileImage(user)!} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">{user?.name}</p>
                                            <p className="text-gray-400 text-sm">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link href="/dashboard" className="flex items-center gap-3 text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                                    </Link>
                                    {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                        <Link href="/management" className="flex items-center gap-3 text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                            <Settings className="w-5 h-5" /> Management
                                        </Link>
                                    )}
                                    <Link href="/profile" className="flex items-center gap-3 text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                        <UserCircle className="w-5 h-5" /> Profile
                                    </Link>
                                    <button
                                        onClick={() => { logout(); router.push('/'); }}
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
