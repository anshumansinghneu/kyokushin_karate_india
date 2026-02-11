'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Calendar, CreditCard, User, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', auth: true },
    { href: '/payments', icon: CreditCard, label: 'Pay', auth: true },
    { href: '/profile', icon: User, label: 'Profile', auth: true },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();

    const visibleItems = NAV_ITEMS.filter(item => !item.auth || isAuthenticated);

    // Hide on management pages, login, register
    const hiddenPaths = ['/login', '/register', '/management', '/forgot-password', '/reset-password'];
    if (hiddenPaths.some(p => pathname.startsWith(p))) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
            {/* Gradient blur edge */}
            <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)] light-mode:bg-white/95 light-mode:border-gray-200">
                <div className="flex items-center justify-around h-16">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex flex-col items-center justify-center w-16 h-full"
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
                </div>
            </div>
        </nav>
    );
}
