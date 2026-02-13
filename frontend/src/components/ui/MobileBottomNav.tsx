'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Calendar, CreditCard, User, LayoutDashboard, LogIn, UserPlus,
    ShieldCheck, Radio, MoreHorizontal, X,
    ShoppingBag, Image, Users, BookOpen, Newspaper, Award, GraduationCap, Heart, HandHeart
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const AUTH_ITEMS = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/profile', icon: User, label: 'Profile' },
];

const GUEST_ITEMS = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/login', icon: LogIn, label: 'Login' },
    { href: '/register', icon: UserPlus, label: 'Join' },
];

const MORE_AUTH_ITEMS = [
    { href: '/payments', icon: CreditCard, label: 'Payments' },
    { href: '/verify', icon: ShieldCheck, label: 'Belt Verify' },
    { href: '/live', icon: Radio, label: 'Live Matches', adminOnly: true },
    { href: '/store', icon: ShoppingBag, label: 'Store' },
    { href: '/gallery', icon: Image, label: 'Gallery' },
    { href: '/instructors', icon: Users, label: 'Instructors' },
    { href: '/dojos', icon: GraduationCap, label: 'Find a Dojo' },
    { href: '/blog', icon: BookOpen, label: 'Blog' },
    { href: '/media', icon: Newspaper, label: 'Media' },
    { href: '/syllabus', icon: Award, label: 'Syllabus' },
    { href: '/sponsors', icon: Heart, label: 'Sponsors' },
    { href: '/csr', icon: HandHeart, label: 'CSR' },
];

const MORE_GUEST_ITEMS = [
    { href: '/verify', icon: ShieldCheck, label: 'Belt Verify' },
    { href: '/store', icon: ShoppingBag, label: 'Store' },
    { href: '/gallery', icon: Image, label: 'Gallery' },
    { href: '/instructors', icon: Users, label: 'Instructors' },
    { href: '/dojos', icon: GraduationCap, label: 'Find a Dojo' },
    { href: '/blog', icon: BookOpen, label: 'Blog' },
    { href: '/media', icon: Newspaper, label: 'Media' },
    { href: '/syllabus', icon: Award, label: 'Syllabus' },
    { href: '/sponsors', icon: Heart, label: 'Sponsors' },
    { href: '/csr', icon: HandHeart, label: 'CSR' },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuthStore();
    const [showMore, setShowMore] = useState(false);

    const mainItems = isAuthenticated ? AUTH_ITEMS : GUEST_ITEMS;
    let moreItems = isAuthenticated ? MORE_AUTH_ITEMS : MORE_GUEST_ITEMS;
    if (isAuthenticated && user?.role !== 'ADMIN') {
        moreItems = moreItems.filter(item => !('adminOnly' in item && item.adminOnly));
    }

    // Hide on management pages and forgot/reset password
    const hiddenPaths = ['/management', '/forgot-password', '/reset-password'];
    if (hiddenPaths.some(p => pathname.startsWith(p))) return null;

    const isMoreActive = moreItems.some(
        item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
    );

    return (
        <>
            {/* "More" Bottom Sheet Overlay */}
            <AnimatePresence>
                {showMore && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
                            onClick={() => setShowMore(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[120] md:hidden"
                        >
                            <div className="bg-zinc-900 border-t border-white/10 rounded-t-3xl max-h-[70vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                                {/* Handle bar */}
                                <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-zinc-900 rounded-t-3xl z-10">
                                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                                </div>
                                <div className="flex items-center justify-between px-5 pb-3 border-b border-white/5">
                                    <h3 className="text-white font-bold text-lg">More</h3>
                                    <button
                                        onClick={() => setShowMore(false)}
                                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-1 p-4">
                                    {moreItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/' && pathname.startsWith(item.href));
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setShowMore(false)}
                                                className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl min-h-[72px] transition-all active:scale-95 ${
                                                    isActive
                                                        ? 'bg-red-500/10 text-red-500'
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                <Icon className="w-6 h-6" />
                                                <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
                {/* Gradient blur edge */}
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center justify-around h-16">
                        {mainItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/' && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center w-16 h-full min-w-[44px] min-h-[44px] touch-action-manipulation active:scale-95 transition-transform"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomnav-indicator"
                                            className="absolute -top-0.5 w-8 h-0.5 bg-red-500 rounded-full"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-5 h-5 transition-colors duration-200 ${
                                            isActive ? 'text-red-500' : 'text-gray-500'
                                        }`}
                                    />
                                    <span
                                        className={`text-[10px] mt-0.5 font-bold transition-colors duration-200 ${
                                            isActive ? 'text-red-500' : 'text-gray-500'
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}

                        {/* More Button */}
                        <button
                            onClick={() => setShowMore(!showMore)}
                            className="relative flex flex-col items-center justify-center w-16 h-full min-w-[44px] min-h-[44px] touch-action-manipulation active:scale-95 transition-transform"
                        >
                            {(isMoreActive || showMore) && (
                                <motion.div
                                    layoutId="bottomnav-indicator-more"
                                    className="absolute -top-0.5 w-8 h-0.5 bg-red-500 rounded-full"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <MoreHorizontal
                                className={`w-5 h-5 transition-colors duration-200 ${
                                    isMoreActive || showMore ? 'text-red-500' : 'text-gray-500'
                                }`}
                            />
                            <span
                                className={`text-[10px] mt-0.5 font-bold transition-colors duration-200 ${
                                    isMoreActive || showMore ? 'text-red-500' : 'text-gray-500'
                                }`}
                            >
                                More
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
