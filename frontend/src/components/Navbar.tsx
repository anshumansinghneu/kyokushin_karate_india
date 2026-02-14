"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Settings, UserCircle, Receipt,
    ShoppingBag, Calendar, MapPin, Users, Image, Heart, HandHeart, ShieldCheck, Radio, Swords, Shield
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { getUserProfileImage } from "@/lib/imageUtils";
import api from "@/lib/api";
import NotificationCenter from "@/components/NotificationCenter";

interface NavLink {
    name: string;
    href: string;
    icon?: string;
    live?: boolean;
}

interface NavDropdown {
    name: string;
    items: { name: string; href: string; icon: React.ElementType; description?: string; live?: boolean; flagIcon?: string }[];
}

type NavItem = NavLink | NavDropdown;

function isDropdown(item: NavItem): item is NavDropdown {
    return 'items' in item;
}

function DesktopDropdown({ dropdown, pathname }: { dropdown: NavDropdown; pathname: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(undefined);

    const isAnyActive = dropdown.items.some(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));

    const handleEnter = () => {
        clearTimeout(timeoutRef.current);
        setOpen(true);
    };
    const handleLeave = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    };

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
        <div
            ref={ref}
            className="relative"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <button
                className={`text-xs lg:text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
                    isAnyActive ? "text-primary" : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setOpen(!open)}
            >
                {dropdown.name}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="py-1">
                            {dropdown.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                            isActive
                                                ? "text-primary bg-primary/5"
                                                : "text-gray-300 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span className="font-semibold">{item.name}</span>
                                        {item.live && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />}
                                        {item.flagIcon && <img src={item.flagIcon} alt="Flag" className="h-3.5 w-auto rounded-sm ml-auto" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hasLiveMatches, setHasLiveMatches] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isAuthenticated, checkAuth } = useAuthStore();

    // Check auth status on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Check for live matches periodically
    useEffect(() => {
        const checkLive = async () => {
            try {
                const res = await api.get("/matches/live");
                setHasLiveMatches(res.data.data.matches.length > 0);
            } catch {
                setHasLiveMatches(false);
            }
        };
        checkLive();
        const interval = setInterval(checkLive, 30000);
        return () => clearInterval(interval);
    }, []);

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
        setMobileExpanded(null);
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

    const eventsDropdown: NavDropdown = {
        name: "Events",
        items: [
            { name: "All Events", href: "/events", icon: Calendar, description: "Tournaments & seminars" },
            { name: "Low Kick", href: "/low-kick", icon: Swords, flagIcon: "/india-flag.png" },
            ...(hasLiveMatches ? [{ name: "Live Matches", href: "/live", icon: Radio, live: true }] : []),
        ],
    };

    const exploreDropdown: NavDropdown = {
        name: "Explore",
        items: [
            { name: "Seminars", href: "/seminars", icon: Shield, description: "Self-defense workshops" },
            { name: "Gallery", href: "/gallery", icon: Image, description: "Photos & moments" },
            { name: "Instructors", href: "/instructors", icon: Users, description: "Our senseis" },
            { name: "Sponsors", href: "/sponsors", icon: Heart, description: "Our partners" },
            { name: "CSR", href: "/csr", icon: HandHeart, description: "Social responsibility" },
        ],
    };

    const navItems: NavItem[] = [
        { name: "Dojos", href: "/dojos" },
        eventsDropdown,
        exploreDropdown,
        { name: "Store", href: "/store" },
        { name: "Verify", href: "/verify" },
    ];

    // Flat list for mobile
    const mobileGroups = [
        {
            label: null,
            items: [{ name: "Dojos", href: "/dojos", icon: MapPin }],
        },
        {
            label: "Events",
            items: [
                { name: "All Events", href: "/events", icon: Calendar },
                { name: "Low Kick", href: "/low-kick", icon: Swords, flagIcon: "/india-flag.png" },
                ...(hasLiveMatches ? [{ name: "Live Matches", href: "/live", icon: Radio, live: true }] : []),
            ],
        },
        {
            label: "Explore",
            items: [
                { name: "Seminars", href: "/seminars", icon: Shield },
                { name: "Gallery", href: "/gallery", icon: Image },
                { name: "Instructors", href: "/instructors", icon: Users },
                { name: "Sponsors", href: "/sponsors", icon: Heart },
                { name: "CSR", href: "/csr", icon: HandHeart },
            ],
        },
        {
            label: null,
            items: [
                { name: "Store", href: "/store", icon: ShoppingBag },
                { name: "Verify Belt", href: "/verify", icon: ShieldCheck },
            ],
        },
    ];

    return (
        <nav
            className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-gpu duration-300 gpu-accelerate ${
                scrolled ? "bg-black/80 backdrop-blur-md py-4 border-b border-white/10" : "bg-transparent py-4 md:py-6"
            }`}
        >
            <div className="container-responsive flex justify-between items-center">
                {/* Brand */}
                <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter z-50 relative">
                    <span className="bg-gradient-to-r from-orange-500 via-white to-green-500 bg-clip-text text-transparent italic">KKFI</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    {navItems.map((item) =>
                        isDropdown(item) ? (
                            <DesktopDropdown key={item.name} dropdown={item} pathname={pathname} />
                        ) : (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-xs lg:text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                                    pathname === item.href ? "text-primary" : "text-gray-300 hover:text-white"
                                }`}
                            >
                                {item.name}
                            </Link>
                        )
                    )}

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <NotificationCenter />
                            <div className="relative ml-1" ref={dropdownRef}>
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
                                                <Link
                                                    href="/payments"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <Receipt className="w-4 h-4" />
                                                    Payments
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
                    className="md:hidden z-50 text-white p-3 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 touch-action-manipulation"
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
                            <div className="pt-20 px-6 pb-8 flex flex-col gap-1">
                                {mobileGroups.map((group, gi) => (
                                    <div key={gi}>
                                        {group.label ? (
                                            <>
                                                <button
                                                    onClick={() => setMobileExpanded(mobileExpanded === group.label ? null : group.label)}
                                                    className="flex items-center justify-between w-full text-xl font-bold uppercase tracking-wider text-white py-4 px-4 rounded-lg hover:bg-white/5 active:bg-white/10 border-b border-white/5 min-h-[52px]"
                                                >
                                                    <span>{group.label}</span>
                                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${mobileExpanded === group.label ? 'rotate-180' : ''}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {mobileExpanded === group.label && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pl-4 py-1 space-y-0.5">
                                                                {group.items.map((item) => {
                                                                    const Icon = item.icon;
                                                                    return (
                                                                        <Link
                                                                            key={item.href}
                                                                            href={item.href}
                                                                            className={`flex items-center gap-3 text-lg font-semibold py-3 px-4 rounded-lg transition-colors min-h-[48px] ${
                                                                                pathname === item.href ? 'text-primary bg-primary/5' : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                                            }`}
                                                                        >
                                                                            <Icon className="w-5 h-5 shrink-0" />
                                                                            <span>{item.name}</span>
                                                                            {'live' in item && item.live && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />}
                                                                            {'flagIcon' in item && item.flagIcon && <img src={item.flagIcon} alt="Flag" className="h-4 w-auto rounded-sm ml-auto" />}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </>
                                        ) : (
                                            group.items.map((item, index) => {
                                                const Icon = item.icon;
                                                return (
                                                    <motion.div
                                                        key={item.href}
                                                        initial={{ opacity: 0, x: 50 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: (gi + index) * 0.06 }}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            className={`flex items-center gap-3 text-xl font-bold uppercase tracking-wider py-4 px-4 rounded-lg border-b border-white/5 min-h-[52px] transition-colors ${
                                                                pathname === item.href ? 'text-primary' : 'text-white hover:text-primary hover:bg-white/5 active:bg-white/10'
                                                            }`}
                                                        >
                                                            <Icon className="w-5 h-5 shrink-0" />
                                                            {item.name}
                                                        </Link>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
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
                                        <Link href="/payments" className="flex items-center gap-3 text-lg font-bold uppercase tracking-wider text-white hover:text-primary py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                                            <Receipt className="w-5 h-5" /> Payments
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
