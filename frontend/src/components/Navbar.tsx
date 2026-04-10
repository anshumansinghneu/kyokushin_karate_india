"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Settings, UserCircle, Receipt,
    ShoppingBag, Calendar, MapPin, Users, Image as ImageIcon, Heart, HandHeart, ShieldCheck, Radio, Swords, Shield, BookOpen, Award
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
            className="relative h-full flex items-center"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <button
                className={`text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 h-full relative ${
                    isAnyActive ? "text-white" : "text-zinc-400 hover:text-white group"
                }`}
            >
                {dropdown.name}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180 text-white' : ''}`} />
                {open && (
                    <motion.div layoutId="navIndicator" className="absolute inset-0 bg-white/5 rounded-full" transition={{ duration: 0.2 }} />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-64 bg-black/70 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[60]"
                    >
                        {dropdown.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group/item relative overflow-hidden ${
                                        isActive
                                            ? "bg-white/10"
                                            : "hover:bg-white/5"
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-zinc-400 group-hover/item:text-white'} transition-colors`}>
                                        <Icon className="w-4 h-4 shrink-0" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-zinc-300 group-hover/item:text-white'}`}>
                                            {item.name}
                                        </span>
                                        {item.description && (
                                            <span className="text-[10px] text-zinc-500 mt-0.5">{item.description}</span>
                                        )}
                                    </div>
                                    {item.live && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />}
                                    {item.flagIcon && <img src={item.flagIcon} alt="Flag" className="h-3 ml-auto opacity-70" />}
                                </Link>
                            );
                        })}
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

    useEffect(() => {
        if (!user && isAuthenticated) checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setDropdownOpen(false);
        setMobileExpanded(null);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            { name: "What is Kyokushin?", href: "/what-is-kyokushin", icon: BookOpen, description: "Learn the art" },
            { name: "Belt System", href: "/belt-system", icon: Award, description: "Ranking guide" },
            { name: "Seminars", href: "/seminars", icon: Shield, description: "Self-defense classes" },
            { name: "Gallery", href: "/gallery", icon: ImageIcon, description: "Photos & moments" },
            { name: "Instructors", href: "/instructors", icon: Users, description: "Our senseis" },
            { name: "Black Belts", href: "/black-belts", icon: Award, description: "Dan holders" },
        ],
    };

    const navItems: NavItem[] = [
        { name: "Find a Dojo", href: "/find-a-dojo" },
        eventsDropdown,
        exploreDropdown,
        { name: "Store", href: "/store" },
        { name: "Verify", href: "/verify" },
    ];

    const mobileGroups = [
        {
            label: null,
            items: [{ name: "Find a Dojo", href: "/find-a-dojo", icon: MapPin }],
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
                { name: "What is Kyokushin?", href: "/what-is-kyokushin", icon: BookOpen },
                { name: "Belt System", href: "/belt-system", icon: Award },
                { name: "Seminars", href: "/seminars", icon: Shield },
                { name: "Gallery", href: "/gallery", icon: ImageIcon },
                { name: "Instructors", href: "/instructors", icon: Users },
                { name: "Black Belts", href: "/black-belts", icon: Award },
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
        <>
            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#050507]/90 backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center justify-between px-5 h-16">
                    <Link href="/" className="text-2xl font-black tracking-tighter">
                        <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#138808] bg-clip-text text-transparent italic">KKFI</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        {isAuthenticated && <NotificationCenter />}
                        <button
                            className="z-50 text-white p-2 flex items-center justify-center -mr-2 bg-white/5 rounded-full border border-white/10"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Premium Floating Nav */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`hidden md:flex fixed top-0 left-0 right-0 z-50 w-full justify-center transition-all duration-500 ease-in-out pointer-events-none ${
                    scrolled ? "pt-4 px-4" : "pt-8 px-8"
                }`}
            >
                <div className={`flex items-center justify-between border border-white/[0.08] shadow-2xl backdrop-blur-3xl transition-all duration-500 ease-in-out pointer-events-auto ${
                    scrolled ? "bg-black/60 rounded-full px-5 py-2.5 max-w-[1000px] w-full" : "bg-black/30 rounded-3xl px-8 py-4 max-w-[1200px] w-full"
                }`}>
                    {/* Brand */}
                    <Link href="/" className="flex flex-shrink-0 items-center justify-center">
                        <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#FF9933] via-white to-[#138808] bg-clip-text text-transparent italic leading-none">KKFI</span>
                    </Link>

                    {/* Links */}
                    <div className="flex items-center justify-center h-10 ml-8 flex-1">
                        {navItems.map((item) =>
                            isDropdown(item) ? (
                                <DesktopDropdown key={item.name} dropdown={item} pathname={pathname} />
                            ) : (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`relative text-xs font-bold uppercase tracking-widest px-4 h-full flex items-center transition-colors group ${
                                        pathname === item.href ? "text-white" : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {item.name}
                                    {pathname === item.href && (
                                        <motion.div layoutId="navIndicator" className="absolute inset-0 bg-white/5 rounded-full" transition={{ duration: 0.2 }} />
                                    )}
                                </Link>
                            )
                        )}
                    </div>

                    {/* End Actions */}
                    <div className="flex items-center flex-shrink-0 ml-4">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <NotificationCenter />
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center overflow-hidden border border-white/20">
                                            {getUserProfileImage(user) ? (
                                                <img src={getUserProfileImage(user)!} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors max-w-[100px] truncate">
                                            {user?.name?.split(' ')[0] || 'Account'}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {dropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                                                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
                                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                                className="absolute right-0 top-full mt-3 w-60 bg-black/70 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[60]"
                                            >
                                                <div className="px-3 py-3 mb-2 bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/5">
                                                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                                                </div>
                                                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                                </Link>
                                                {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                                    <Link href="/management" className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                                        <Settings className="w-4 h-4" /> Management
                                                    </Link>
                                                )}
                                                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                                    <UserCircle className="w-4 h-4" /> Profile
                                                </Link>
                                                <div className="h-px bg-white/10 my-2 mx-2" />
                                                <button
                                                    onClick={() => { logout(); setDropdownOpen(false); router.push('/'); }}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full text-left"
                                                >
                                                    <LogOut className="w-4 h-4" /> Logout
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/login" className="text-xs font-bold text-zinc-300 hover:text-white uppercase tracking-widest px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/register" className="text-xs font-bold text-black bg-white hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase tracking-widest px-5 py-2.5 rounded-full transition-all">
                                    Join Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "-100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "-100%" }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 bg-[#050507]/95 backdrop-blur-3xl z-40 flex flex-col md:hidden overflow-y-auto"
                        style={{ touchAction: 'pan-y' }}
                    >
                        <div className="pt-24 px-6 pb-20 flex flex-col gap-2">
                            {mobileGroups.map((group, gi) => (
                                <div key={gi} className="mb-2">
                                    {group.label ? (
                                        <>
                                            <button
                                                onClick={() => setMobileExpanded(mobileExpanded === group.label ? null : group.label)}
                                                className="flex items-center justify-between w-full text-sm font-black uppercase tracking-widest text-zinc-500 py-4"
                                            >
                                                <span>{group.label}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileExpanded === group.label ? 'rotate-180 text-white' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {mobileExpanded === group.label && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="flex flex-col gap-2 pt-2 pb-4">
                                                            {group.items.map((item) => {
                                                                const Icon = item.icon;
                                                                return (
                                                                    <Link
                                                                        key={item.href}
                                                                        href={item.href}
                                                                        className={`flex items-center gap-4 text-xl font-black py-2 transition-colors ${
                                                                            pathname === item.href ? 'text-red-500' : 'text-white'
                                                                        }`}
                                                                    >
                                                                        <div className={`p-2 rounded-xl ${pathname === item.href ? 'bg-red-500/20' : 'bg-white/5'}`}>
                                                                             <Icon className="w-5 h-5 shrink-0" />
                                                                        </div>
                                                                        <span>{item.name}</span>
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
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 + (gi + index) * 0.05 }}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        className={`flex items-center gap-4 text-xl font-black py-4 transition-colors ${
                                                            pathname === item.href ? 'text-red-500' : 'text-white'
                                                        }`}
                                                    >
                                                        <div className={`p-2 rounded-xl ${pathname === item.href ? 'bg-red-500/20' : 'bg-white/5'}`}>
                                                            <Icon className="w-5 h-5 shrink-0" />
                                                        </div>
                                                        {item.name}
                                                    </Link>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            ))}

                            <div className="my-4 h-px bg-white/10 w-full" />

                            {isAuthenticated ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden">
                                            {getUserProfileImage(user) ? (
                                                <img src={getUserProfileImage(user)!} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-zinc-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-xl">{user?.name}</p>
                                            <p className="text-zinc-500 text-sm font-semibold">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link href="/dashboard" className="flex items-center gap-4 text-lg font-bold text-white py-2"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
                                    <Link href="/profile" className="flex items-center gap-4 text-lg font-bold text-white py-2"><UserCircle className="w-5 h-5" /> My Profile</Link>
                                    <button onClick={() => { logout(); router.push('/'); }} className="flex items-center gap-4 text-lg font-bold text-red-500 py-2 mt-4"><LogOut className="w-5 h-5" /> Sign Out</button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 mt-4">
                                    <Link href="/login" className="w-full"><Button variant="outline" className="text-white border-white/20 w-full rounded-2xl h-14 text-lg font-black hover:bg-white/10">Sign In</Button></Link>
                                    <Link href="/register" className="w-full"><Button className="bg-red-600 hover:bg-red-700 text-white w-full rounded-2xl h-14 text-lg font-black">Join KKFI Now</Button></Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
