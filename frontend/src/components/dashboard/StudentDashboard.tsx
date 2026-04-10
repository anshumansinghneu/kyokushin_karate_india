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
import AnonymousFeedbackModal from "@/components/AnonymousFeedbackModal";

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
    const [showAnonFeedback, setShowAnonFeedback] = useState(false);

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
                <div className="pt-2 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Avatar + Greeting */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-900/20 ring-1 ring-white/10 overflow-hidden">
                                {user?.profilePhotoUrl ? (
                                    <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    firstName[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050505]" />
                        </div>

                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                                <span className="text-white/70">{greeting}, </span>
                                <span className="text-white">{firstName}</span>
                            </h1>
                            {user?.dojo?.name && (
                                <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {user.dojo.name}{user.dojo.city ? `, ${user.dojo.city}` : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Tab Navigation */}
                    <div className="flex gap-1 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 w-full md:w-auto bg-white/[0.02] md:bg-transparent p-1 rounded-xl border border-white/[0.04] md:border-0">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap min-h-[36px] ${
                                        isActive
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                            : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
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

                            {/* Quick Stats — monochrome */}
                            <div data-tour="quick-stats" className="grid grid-cols-2 gap-2">
                                {[
                                    { icon: Activity, value: user?.currentBeltRank || 'White', label: 'Current Rank' },
                                    { icon: Trophy, value: tournamentResults.length, label: 'Tournaments' },
                                    { icon: CheckCircle, value: registeredEvents.length, label: 'Events' },
                                    { icon: Zap, value: user?.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive', label: 'Status' },
                                ].map((stat, i) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="rounded-xl border border-white/[0.05] p-3 flex items-center gap-3 hover:border-white/[0.1] transition-colors"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4 text-zinc-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-extrabold text-white leading-tight truncate">{stat.value}</p>
                                                <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">{stat.label}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick Links — clean row */}
                            <div data-tour="quick-links">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mb-2">Quick Access</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { href: '/payments', icon: CreditCard, label: 'Payments' },
                                        { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
                                        { href: '/verify', icon: ShieldCheck, label: 'Verify' },
                                    ].map((link, i) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link
                                                key={i}
                                                href={link.href}
                                                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.05] hover:border-white/[0.1] transition-colors"
                                            >
                                                <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-white transition-colors">{link.label}</span>
                                            </Link>
                                        );
                                    })}
                                    <button
                                        onClick={() => setShowAnonFeedback(true)}
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.05] hover:border-red-600/20 transition-colors"
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-white transition-colors">Feedback</span>
                                    </button>
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
                                <div className="relative overflow-hidden rounded-xl border border-white/[0.05]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 to-transparent" />

                                    <div className="relative z-10 p-5">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> Next Event
                                                </p>
                                                <h3 className="text-lg md:text-xl font-black text-white mb-1.5 leading-tight truncate">{nextEvent.name}</h3>
                                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-red-500/60" />
                                                        {new Date(nextEvent.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    {nextEvent.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-red-500/60" />
                                                            {nextEvent.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Countdown */}
                                            <div className="flex gap-1.5">
                                                {[
                                                    { value: timeLeft.days, label: 'D' },
                                                    { value: timeLeft.hours, label: 'H' },
                                                    { value: timeLeft.minutes, label: 'M' },
                                                    { value: timeLeft.seconds, label: 'S' },
                                                ].map((unit, i) => (
                                                    <div key={i} className="w-12 bg-black/40 rounded-lg p-2 text-center border border-white/[0.05]">
                                                        <span className="block text-lg font-black text-white tabular-nums leading-none">{String(unit.value).padStart(2, '0')}</span>
                                                        <span className="text-[8px] uppercase text-zinc-600 font-bold mt-0.5 block">{unit.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Events & Achievements Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Upcoming Events */}
                                <div className="rounded-xl border border-white/[0.05] overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                            <div className="w-[3px] h-4 rounded-full bg-red-600" />
                                            Upcoming Events
                                        </h3>
                                        <Link href="/events" className="text-[9px] font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
                                            All <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <div className="p-2">
                                        {upcomingEvents.map((event, i) => (
                                            <Link href={`/events/${event.id}`} key={i} className="block group">
                                                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                                                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-[8px] font-bold text-red-500 uppercase leading-none">{new Date(event.startDate).toLocaleString('default', { month: 'short' })}</span>
                                                        <span className="text-sm font-black text-white leading-none">{new Date(event.startDate).getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">{event.name}</h4>
                                                        <p className="text-[10px] text-zinc-600 truncate">{event.location}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        {upcomingEvents.length === 0 && (
                                            <div className="text-center py-8">
                                                <Calendar className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
                                                <p className="text-zinc-600 text-xs">No upcoming events</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div className="rounded-xl border border-white/[0.05] overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                            <div className="w-[3px] h-4 rounded-full bg-red-600" />
                                            Achievements
                                        </h3>
                                    </div>
                                    <div className="p-2">
                                        {tournamentResults.slice(0, 3).map((result: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-[3px] h-8 rounded-full ${
                                                        result.medal === 'GOLD' ? 'bg-yellow-500' :
                                                        result.medal === 'SILVER' ? 'bg-zinc-400' :
                                                        result.medal === 'BRONZE' ? 'bg-orange-600' :
                                                        'bg-zinc-700'
                                                    }`} />
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">{result.event.name}</h4>
                                                        <p className="text-[10px] text-zinc-600">{result.categoryName}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-white tabular-nums">#{result.finalRank}</span>
                                            </div>
                                        ))}
                                        {tournamentResults.length === 0 && (
                                            <div className="text-center py-8">
                                                <Trophy className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
                                                <p className="text-zinc-600 text-xs">No achievements yet</p>
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

            <AnonymousFeedbackModal isOpen={showAnonFeedback} onClose={() => setShowAnonFeedback(false)} />
        </motion.div>
    );
}
