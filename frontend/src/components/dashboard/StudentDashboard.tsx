import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, Trophy, Activity, ChevronRight, User, CheckCircle,
    Clock, Zap, MapPin, FileText, Edit, CreditCard, CalendarDays,
    ShieldCheck, ShoppingBag, Sparkles
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

import MembershipCard from "./MembershipCard";
import BlogManager from "./BlogManager";
import BlogSubmission from "./BlogSubmission";
import FightRecordCard from "./FightRecordCard";
import ProfileCompletionBar from "@/components/ui/ProfileCompletionBar";
// OnboardingTour removed
import MyOrders from "./MyOrders";
import BeltTimeline from "./BeltTimeline";

const TABS = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'blogs', label: 'My Blogs', icon: FileText },
    { key: 'submit', label: 'Write Blog', icon: Edit },
    { key: 'orders', label: 'My Orders', icon: ShoppingBag },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function StudentDashboard({ user }: { user: any }) {
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [nextEvent, setNextEvent] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const { showToast } = useToast();

    // Time-based greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Ohayō";
        if (hour < 17) return "Osu";
        return "Konbanwa";
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Karateka';

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get('/events');
                const events = response.data.data.events;
                setUpcomingEvents(events.slice(0, 3));

                // Find next event
                const futureEvents = events.filter((e: any) => new Date(e.startDate) > new Date());
                if (futureEvents.length > 0) {
                    setNextEvent(futureEvents[0]);
                }
            } catch (error) {
                console.error("Failed to fetch events", error);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!nextEvent) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const eventTime = new Date(nextEvent.startDate).getTime();
            const distance = eventTime - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [nextEvent]);

    const registeredEvents = user?.registrations || [];
    const tournamentResults = user?.tournamentResults || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 md:space-y-8"
        >
            {/* ═══════════════════ Welcome Header ═══════════════════ */}
            <motion.div variants={itemVariants} className="relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

                <div className="pt-4 pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    {/* Left: Avatar + Greeting */}
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                            className="relative flex-shrink-0"
                        >
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg shadow-red-900/30 ring-2 ring-white/10 overflow-hidden">
                                {user?.profilePhotoUrl ? (
                                    <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    firstName[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                        </motion.div>

                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-bold mb-0.5 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-red-500" />
                                Dojo Dashboard
                            </p>
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                                <span className="text-white/80">{greeting}, </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">{firstName}</span>
                            </h1>
                            {user?.dojo?.name && (
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {user.dojo.name}{user.dojo.city ? `, ${user.dojo.city}` : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Tab Navigation */}
                    <div className="flex gap-1.5 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 w-full md:w-auto">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap min-h-[44px] ${
                                        isActive
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                                            : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
            </motion.div>

            {/* ═══════════════════ Tab Content ═══════════════════ */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8"
                    >
                        {/* ───── Left Column (4 cols) ───── */}
                        <div className="lg:col-span-4 space-y-6">
                            <div data-tour="membership-card">
                                <MembershipCard user={user} />
                            </div>

                            <div>
                                <ProfileCompletionBar user={user} />
                            </div>

                            {/* Quick Stats */}
                            <div data-tour="quick-stats" className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Activity, value: user?.currentBeltRank || 'White', label: 'Current Rank', color: 'red', bg: 'bg-red-500/10', hoverBg: 'group-hover:bg-red-500/20', text: 'text-red-500', border: 'hover:border-red-500/30', glow: 'from-red-500/20 to-red-600/5' },
                                    { icon: Trophy, value: tournamentResults.length, label: 'Tournaments', color: 'blue', bg: 'bg-blue-500/10', hoverBg: 'group-hover:bg-blue-500/20', text: 'text-blue-500', border: 'hover:border-blue-500/30', glow: 'from-blue-500/20 to-blue-600/5' },
                                    { icon: CheckCircle, value: registeredEvents.length, label: 'Events', color: 'green', bg: 'bg-green-500/10', hoverBg: 'group-hover:bg-green-500/20', text: 'text-green-500', border: 'hover:border-green-500/30', glow: 'from-green-500/20 to-green-600/5' },
                                    { icon: Zap, value: user?.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive', label: 'Status', color: 'yellow', bg: 'bg-yellow-500/10', hoverBg: 'group-hover:bg-yellow-500/20', text: 'text-yellow-500', border: 'hover:border-yellow-500/30', glow: 'from-yellow-500/20 to-yellow-600/5' },
                                ].map((stat, i) => {
                                    const Icon = stat.icon;
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.15 + i * 0.07 }}
                                            className={`relative overflow-hidden rounded-2xl border border-white/[0.08] p-4 flex flex-col items-center justify-center text-center group ${stat.border} transition-all duration-300 hover:scale-[1.02]`}
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                            <div className="relative z-10">
                                                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2 ${stat.hoverBg} transition-colors`}>
                                                    <Icon className={`w-5 h-5 ${stat.text}`} />
                                                </div>
                                                <p className="text-xl font-black text-white leading-tight">{stat.value}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{stat.label}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Quick Links */}
                            <div data-tour="quick-links">
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-3">Quick Access</p>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { href: '/payments', icon: CreditCard, label: 'Payments', bg: 'bg-green-500/10', hoverBg: 'group-hover:bg-green-500/20', text: 'text-green-500', border: 'hover:border-green-500/30' },
                                        { href: '/calendar', icon: CalendarDays, label: 'Calendar', bg: 'bg-purple-500/10', hoverBg: 'group-hover:bg-purple-500/20', text: 'text-purple-500', border: 'hover:border-purple-500/30' },
                                        { href: '/verify', icon: ShieldCheck, label: 'Verify', bg: 'bg-cyan-500/10', hoverBg: 'group-hover:bg-cyan-500/20', text: 'text-cyan-500', border: 'hover:border-cyan-500/30' },
                                    ].map((link, i) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link
                                                key={i}
                                                href={link.href}
                                                className={`group relative overflow-hidden rounded-xl border border-white/[0.06] p-3.5 flex flex-col items-center justify-center text-center ${link.border} transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg ${link.bg} flex items-center justify-center mb-1.5 ${link.hoverBg} transition-colors`}>
                                                    <Icon className={`w-4 h-4 ${link.text}`} />
                                                </div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold group-hover:text-white transition-colors">{link.label}</p>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ───── Right Column (8 cols) ───── */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Fight Record */}
                            <div>
                                <FightRecordCard />
                            </div>

                            {/* Belt Timeline */}
                            {user?.id && (
                                <div>
                                    <BeltTimeline userId={user.id} />
                                </div>
                            )}

                            {/* Next Event Countdown */}
                            {nextEvent && (
                                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/80 via-black/90 to-black/80" />
                                    <div className="absolute inset-0 bg-[url('/training-bg.png')] bg-cover bg-center opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700" />
                                    <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />

                                    <div className="relative z-10 p-5 md:p-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                                <Clock className="w-3 h-3" />
                                            </motion.div>
                                            Next Event
                                        </div>

                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight truncate">{nextEvent.name}</h3>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 text-sm">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-red-500/70" />
                                                        {new Date(nextEvent.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    {nextEvent.location && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-4 h-4 text-red-500/70" />
                                                            {nextEvent.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Countdown */}
                                            <div className="flex gap-2 w-full md:w-auto">
                                                {[
                                                    { value: timeLeft.days, label: 'Days' },
                                                    { value: timeLeft.hours, label: 'Hrs' },
                                                    { value: timeLeft.minutes, label: 'Min' },
                                                    { value: timeLeft.seconds, label: 'Sec' },
                                                ].map((unit, i) => (
                                                    <div key={i} className="flex-1 md:flex-none md:min-w-[60px] bg-black/50 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/[0.08]">
                                                        <span className="block text-2xl md:text-3xl font-black text-white tabular-nums leading-none">{String(unit.value).padStart(2, '0')}</span>
                                                        <span className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mt-1 block">{unit.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Events & Achievements Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Upcoming Events */}
                                <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-red-500" />
                                            </div>
                                            Upcoming Events
                                        </h3>
                                        <Link href="/events" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
                                            All <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <div className="p-3 space-y-1">
                                        {upcomingEvents.map((event, i) => (
                                            <Link href={`/events/${event.id}`} key={i} className="block group">
                                                <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex flex-col items-center justify-center border border-white/[0.08] group-hover:border-red-500/30 transition-colors flex-shrink-0">
                                                        <span className="text-[9px] font-bold text-red-500 uppercase leading-none">{new Date(event.startDate).toLocaleString('default', { month: 'short' })}</span>
                                                        <span className="text-lg font-black text-white leading-none">{new Date(event.startDate).getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">{event.name}</h4>
                                                        <p className="text-[11px] text-gray-500 truncate">{event.location}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                </div>
                                            </Link>
                                        ))}
                                        {upcomingEvents.length === 0 && (
                                            <div className="text-center py-8">
                                                <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">No upcoming events</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                            </div>
                                            Achievements
                                        </h3>
                                    </div>
                                    <div className="p-3 space-y-1">
                                        {tournamentResults.slice(0, 3).map((result: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-10 rounded-full ${
                                                        result.medal === 'GOLD' ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' :
                                                        result.medal === 'SILVER' ? 'bg-gradient-to-b from-gray-300 to-gray-500' :
                                                        result.medal === 'BRONZE' ? 'bg-gradient-to-b from-orange-500 to-orange-700' :
                                                        'bg-gray-700'
                                                    }`} />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{result.event.name}</h4>
                                                        <p className="text-[11px] text-gray-500">{result.categoryName}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-white tabular-nums">#{result.finalRank}</span>
                                            </div>
                                        ))}
                                        {tournamentResults.length === 0 && (
                                            <div className="text-center py-8">
                                                <Trophy className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">No achievements yet</p>
                                                <p className="text-gray-700 text-xs mt-1">Compete in a tournament!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'blogs' && (
                    <motion.div
                        key="blogs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <BlogManager />
                    </motion.div>
                )}

                {activeTab === 'submit' && (
                    <motion.div
                        key="submit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <BlogSubmission />
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <MyOrders />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Onboarding Tour */}
            {/* OnboardingTour removed */}
        </motion.div>
    );
}
