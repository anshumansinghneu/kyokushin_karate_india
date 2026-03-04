"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Users, MapPin, Calendar, BarChart, Building, Image, FileText, Newspaper,
    LogOut, Menu, X, Trophy, Award, Megaphone, IndianRupee, Radio, ShoppingBag,
    Ticket, RefreshCw, ChevronDown, Search, ChevronRight, Loader2, BookOpen,
    PanelLeftClose, PanelLeftOpen, UserCheck, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";

// Lazy-loaded tab components for code splitting
const UserManagementTable = lazy(() => import("./UserManagementTable"));
const DojoManager = lazy(() => import("./DojoManager"));
const EventManager = lazy(() => import("./EventManager"));
const BlogManager = lazy(() => import("./BlogManager"));
const MediaManager = lazy(() => import("./MediaManager"));
const RecognitionManager = lazy(() => import("./RecognitionManager"));
const BeltPromotionsView = lazy(() => import("./BeltPromotionsView"));
const BeltApprovalsView = lazy(() => import("./BeltApprovalsView"));
const BeltExamGrading = lazy(() => import("./BeltExamGrading"));
const TournamentManager = lazy(() => import("./TournamentManager"));
const AnnouncementManager = lazy(() => import('./AnnouncementManager'));
const PaymentManagement = lazy(() => import('./PaymentManagement'));
const LiveMatchManager = lazy(() => import('./LiveMatchManager'));
const StoreManagement = lazy(() => import('./StoreManagement'));
const VoucherManager = lazy(() => import('./VoucherManager'));
const SeminarManager = lazy(() => import('./SeminarManager'));

import OrganizationGraph from "./OrganizationGraph";
import GlobalSearch from "./GlobalSearch";
import StudentDetailView from "./StudentDetailView";
import { useToast } from '@/contexts/ToastContext';

function TabLoader() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Loading module...</span>
            </div>
        </div>
    );
}

type TabId = 'overview' | 'dojos' | 'events' | 'seminars' | 'users' | 'blogs' | 'media' | 'recognition' | 'belt-verifications' | 'belt-promotions' | 'belt-exam-grading' | 'tournaments' | 'announcements' | 'payments' | 'live-management' | 'store' | 'vouchers';

const VALID_TABS: TabId[] = ['overview', 'dojos', 'events', 'seminars', 'users', 'blogs', 'media', 'recognition', 'belt-verifications', 'belt-promotions', 'belt-exam-grading', 'tournaments', 'announcements', 'payments', 'live-management', 'store', 'vouchers'];

export default function AdminDashboard({ user, initialTab }: { user: any; initialTab?: string }) {
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const validInitial = VALID_TABS.includes(initialTab as TabId) ? initialTab as TabId : 'overview';
    const [activeTab, setActiveTab] = useState<TabId>(validInitial);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile overlay
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // desktop collapse
    const [sidebarFilter, setSidebarFilter] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const { logout } = useAuthStore();
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [stats, setStats] = useState({
        users: [] as any[],
        usersCount: 0,
        dojos: 0,
        events: 0,
        pending: 0
    });

    const handleTabChange = useCallback((tab: TabId) => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`/management?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);
        try {
            const [usersRes, dojosRes, eventsRes] = await Promise.all([
                api.get('/users'),
                api.get('/dojos'),
                api.get('/events')
            ]);

            setStats({
                users: usersRes.data.data.users,
                usersCount: usersRes.data.results,
                dojos: dojosRes.data.results,
                events: eventsRes.data.results,
                pending: usersRes.data.data.users.filter((u: any) => u.membershipStatus === 'PENDING').length
            });
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
        } finally {
            setIsStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const toggleSection = (sectionId: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const menuSections = [
        {
            items: [{ id: 'overview', label: 'Overview', icon: BarChart }]
        },
        {
            id: 'people', header: 'PEOPLE',
            items: [
                { id: 'users', label: 'User Management', icon: Users },
                { id: 'belt-verifications', label: 'Belt Verifications', icon: Shield, badge: stats.pending > 0 ? stats.pending : undefined },
                { id: 'belt-promotions', label: 'Belt Promotions', icon: Award },
                { id: 'belt-exam-grading', label: 'Belt Exam Grading', icon: Shield },
            ]
        },
        {
            id: 'finance', header: 'FINANCE',
            items: [
                { id: 'payments', label: 'Payments', icon: IndianRupee },
                { id: 'vouchers', label: 'Cash Vouchers', icon: Ticket },
                { id: 'store', label: 'Merchandise', icon: ShoppingBag },
            ]
        },
        {
            id: 'events-section', header: 'EVENTS',
            items: [
                { id: 'dojos', label: 'Dojo Management', icon: Building },
                { id: 'events', label: 'Event Management', icon: Calendar },
                { id: 'seminars', label: 'Seminars', icon: BookOpen },
                { id: 'tournaments', label: 'Tournaments', icon: Trophy },
                { id: 'live-management', label: 'Live Control', icon: Radio },
            ]
        },
        {
            id: 'content', header: 'CONTENT',
            items: [
                { id: 'blogs', label: 'Blogs', icon: FileText },
                { id: 'media', label: 'Media', icon: Newspaper },
                { id: 'recognition', label: 'Monthly Recognition', icon: Trophy },
                { id: 'announcements', label: 'Announcements', icon: Megaphone },
            ]
        },
    ];

    // Breadcrumb: find the label for the active tab
    const activeLabel = menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Overview';
    const activeSection = menuSections.find(s => s.items.some(i => i.id === activeTab));
    const activeSectionHeader = activeSection?.header;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen
                    bg-[#0c0c0c] border-r border-white/[0.06]
                    flex flex-col transition-all duration-300 ease-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isSidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'}
                    w-[280px]
                `}
            >
                {/* Sidebar Header */}
                <div className={`flex items-center gap-3 border-b border-white/[0.06] ${isSidebarCollapsed ? 'px-3 py-4 justify-center' : 'px-5 py-4'}`}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/30 flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-black text-white tracking-tight leading-none">KYOKUSHIN</h2>
                            <p className="text-[9px] font-bold text-red-400 uppercase tracking-[0.2em] mt-0.5">Admin Console</p>
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar Search */}
                {!isSidebarCollapsed && (
                    <div className="px-3 pt-3 pb-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                            <input
                                value={sidebarFilter}
                                onChange={e => setSidebarFilter(e.target.value)}
                                placeholder="Search menu..."
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 focus:bg-white/[0.05] transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Sidebar Navigation */}
                <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
                    {menuSections.map((section, si) => {
                        const filteredItems = sidebarFilter
                            ? section.items.filter(item => item.label.toLowerCase().includes(sidebarFilter.toLowerCase()))
                            : section.items;
                        if (sidebarFilter && filteredItems.length === 0) return null;
                        const sectionHasActive = section.items.some(item => item.id === activeTab);
                        const isCollapsed = section.id ? collapsedSections.has(section.id) && !sectionHasActive : false;

                        return (
                            <div key={si} className={si > 0 ? 'mt-1' : ''}>
                                {section.header && !isSidebarCollapsed && (
                                    <button
                                        onClick={() => section.id && toggleSection(section.id)}
                                        className="w-full flex items-center justify-between px-3 py-2 mt-3 group cursor-pointer"
                                    >
                                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider group-hover:text-gray-400 transition-colors">
                                            {section.header}
                                        </p>
                                        <ChevronDown className={`w-3 h-3 text-gray-700 group-hover:text-gray-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                                    </button>
                                )}
                                {isSidebarCollapsed && section.header && (
                                    <div className="h-px bg-white/[0.04] mx-2 mt-3 mb-1" />
                                )}
                                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                    {filteredItems.map((item) => {
                                        const isActive = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleTabChange(item.id as TabId)}
                                                title={isSidebarCollapsed ? item.label : undefined}
                                                className={`
                                                    w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all relative group
                                                    ${isSidebarCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}
                                                    ${isActive
                                                        ? 'bg-red-500/10 text-white'
                                                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                                                    }
                                                `}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="adminActiveTab"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-red-500 rounded-r-full"
                                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                    />
                                                )}
                                                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-red-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                                {!isSidebarCollapsed && (
                                                    <>
                                                        <span className="truncate">{item.label}</span>
                                                        {'badge' in item && (item as any).badge ? (
                                                            <span className="ml-auto text-[10px] font-bold bg-red-500/80 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                                {(item as any).badge}
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                                {isSidebarCollapsed && 'badge' in item && (item as any).badge ? (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t border-white/[0.06] p-2">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden lg:flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:text-gray-300 hover:bg-white/[0.03] transition-all justify-center lg:justify-start"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isSidebarCollapsed ? (
                            <PanelLeftOpen className="w-[18px] h-[18px]" />
                        ) : (
                            <>
                                <PanelLeftClose className="w-[18px] h-[18px]" />
                                <span>Collapse</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:text-red-400 hover:bg-red-950/20 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        title="Sign Out"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        {!isSidebarCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
                    <div className="flex items-center justify-between px-4 lg:px-8 h-14">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-gray-400"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <nav className="flex items-center gap-1.5 text-sm">
                                <button
                                    onClick={() => handleTabChange('overview')}
                                    className={`font-medium transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Dashboard
                                </button>
                                {activeTab !== 'overview' && (
                                    <>
                                        {activeSectionHeader && (
                                            <>
                                                <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                                                <span className="text-gray-600 text-xs">{activeSectionHeader}</span>
                                            </>
                                        )}
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                                        <span className="text-white font-semibold">{activeLabel}</span>
                                    </>
                                )}
                            </nav>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:block w-64">
                                <GlobalSearch onResultClick={(userId) => setSelectedStudentId(userId)} />
                            </div>
                            <div className="hidden lg:flex items-center gap-2 pl-3 ml-2 border-l border-white/[0.06]">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-[11px] font-bold text-white">
                                    {user?.name?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-white leading-none">{user?.name?.split(' ')[0]}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sm:hidden px-4 pb-3">
                        <GlobalSearch onResultClick={(userId) => setSelectedStudentId(userId)} />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1600px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-8"
                            >
                                {/* Welcome Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-medium text-green-400">System Online</span>
                                        </div>
                                        <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                                            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                                        </h1>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-gray-300 text-xs h-9"
                                            onClick={() => fetchStats()}
                                            disabled={isStatsLoading}
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isStatsLoading ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-gray-300 text-xs h-9"
                                            onClick={() => {
                                                const headers = "Name,Email,Role,Status\n";
                                                const rows = stats.users.map((u: any) => `${u.name},${u.email},${u.role},${u.membershipStatus}`).join("\n");
                                                const blob = new Blob([headers + rows], { type: "text/csv" });
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = "users_report.csv";
                                                a.click();
                                            }}
                                        >
                                            <BarChart className="w-3.5 h-3.5 mr-1.5" />
                                            Export
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                                    {isStatsLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2.5">
                                                        <div className="h-3 w-20 bg-white/[0.06] rounded" />
                                                        <div className="h-8 w-14 bg-white/[0.06] rounded" />
                                                    </div>
                                                    <div className="w-10 h-10 bg-white/[0.04] rounded-xl" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                    [
                                        { label: "Total Users", value: stats.usersCount, icon: Users, color: "text-blue-400", iconBg: "bg-blue-500/10", border: "border-blue-500/10", tab: 'users' as TabId },
                                        { label: "Active Dojos", value: stats.dojos, icon: Building, color: "text-emerald-400", iconBg: "bg-emerald-500/10", border: "border-emerald-500/10", tab: 'dojos' as TabId },
                                        { label: "Events", value: stats.events, icon: Calendar, color: "text-violet-400", iconBg: "bg-violet-500/10", border: "border-violet-500/10", tab: 'events' as TabId },
                                        { label: "Pending", value: stats.pending, icon: AlertCircle, color: stats.pending > 0 ? "text-amber-400" : "text-gray-500", iconBg: stats.pending > 0 ? "bg-amber-500/10" : "bg-white/[0.03]", border: stats.pending > 0 ? "border-amber-500/10" : "border-white/[0.06]", tab: 'belt-verifications' as TabId },
                                    ].map((stat, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            onClick={() => handleTabChange(stat.tab)}
                                            className={`p-5 rounded-2xl border ${stat.border} bg-white/[0.015] hover:bg-white/[0.04] transition-all duration-200 text-left group`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{stat.label}</p>
                                                    <p className="text-3xl font-black text-white">{stat.value}</p>
                                                </div>
                                                <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                                </div>
                                            </div>
                                        </motion.button>
                                    )))}
                                </div>

                                {/* Quick Actions */}
                                {!isStatsLoading && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-6 w-1 bg-red-600 rounded-full" />
                                            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <button
                                                onClick={() => handleTabChange('dojos')}
                                                className="group p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-emerald-500/[0.05] hover:border-emerald-500/20 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                                        <Building className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <h3 className="text-sm font-bold text-white mb-1">Manage Dojos</h3>
                                                <p className="text-xs text-gray-500">{stats.dojos} active location{stats.dojos !== 1 ? 's' : ''}</p>
                                            </button>

                                            <button
                                                onClick={() => handleTabChange('events')}
                                                className="group p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-violet-500/[0.05] hover:border-violet-500/20 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                                        <Calendar className="w-5 h-5 text-violet-400" />
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <h3 className="text-sm font-bold text-white mb-1">Event Manager</h3>
                                                <p className="text-xs text-gray-500">{stats.events} event{stats.events !== 1 ? 's' : ''} scheduled</p>
                                            </button>

                                            {stats.pending > 0 ? (
                                                <button
                                                    onClick={() => handleTabChange('belt-verifications')}
                                                    className="group p-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] hover:border-amber-500/20 transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                                            <UserCheck className="w-5 h-5 text-amber-400" />
                                                        </div>
                                                        <span className="ml-auto text-[10px] font-bold bg-amber-500/80 text-white px-1.5 py-0.5 rounded-full">{stats.pending}</span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white mb-1">Pending Approvals</h3>
                                                    <p className="text-xs text-gray-500">Review membership requests</p>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleTabChange('vouchers')}
                                                    className="group p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-amber-500/[0.05] hover:border-amber-500/20 transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                                            <Ticket className="w-5 h-5 text-amber-400" />
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white mb-1">Cash Vouchers</h3>
                                                    <p className="text-xs text-gray-500">Issue & manage vouchers</p>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleTabChange('announcements')}
                                                className="group p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-cyan-500/[0.05] hover:border-cyan-500/20 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                                        <Megaphone className="w-5 h-5 text-cyan-400" />
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <h3 className="text-sm font-bold text-white mb-1">Announcements</h3>
                                                <p className="text-xs text-gray-500">Broadcast to members</p>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Membership Breakdown */}
                                {!isStatsLoading && stats.users.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-6 w-1 bg-red-600 rounded-full" />
                                            <h2 className="text-lg font-bold text-white">Membership Breakdown</h2>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {(() => {
                                                const roles = { ADMIN: 0, INSTRUCTOR: 0, STUDENT: 0, OTHER: 0 };
                                                stats.users.forEach((u: any) => {
                                                    if (u.role === 'ADMIN') roles.ADMIN++;
                                                    else if (u.role === 'INSTRUCTOR') roles.INSTRUCTOR++;
                                                    else if (u.role === 'STUDENT') roles.STUDENT++;
                                                    else roles.OTHER++;
                                                });
                                                return [
                                                    { label: 'Admins', count: roles.ADMIN, color: 'text-red-400', dot: 'bg-red-500' },
                                                    { label: 'Instructors', count: roles.INSTRUCTOR, color: 'text-orange-400', dot: 'bg-orange-500' },
                                                    { label: 'Students', count: roles.STUDENT, color: 'text-blue-400', dot: 'bg-blue-500' },
                                                    { label: 'Active', count: stats.users.filter((u: any) => u.membershipStatus === 'APPROVED').length, color: 'text-emerald-400', dot: 'bg-emerald-500' },
                                                ].map((item, i) => (
                                                    <div key={i} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{item.label}</span>
                                                        </div>
                                                        <p className={`text-2xl font-black ${item.color}`}>{item.count}</p>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Quick Navigation Grid */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-6 w-1 bg-red-600 rounded-full" />
                                        <h2 className="text-lg font-bold text-white">Quick Navigation</h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {[
                                            { id: 'users' as TabId, label: 'Users', icon: Users, color: 'text-blue-400', bg: 'hover:bg-blue-500/5' },
                                            { id: 'events' as TabId, label: 'Events', icon: Calendar, color: 'text-violet-400', bg: 'hover:bg-violet-500/5' },
                                            { id: 'tournaments' as TabId, label: 'Tournaments', icon: Trophy, color: 'text-red-400', bg: 'hover:bg-red-500/5' },
                                            { id: 'dojos' as TabId, label: 'Dojos', icon: Building, color: 'text-emerald-400', bg: 'hover:bg-emerald-500/5' },
                                            { id: 'belt-verifications' as TabId, label: 'Belt Verifications', icon: Shield, color: 'text-orange-400', bg: 'hover:bg-orange-500/5' },
                                            { id: 'payments' as TabId, label: 'Payments', icon: IndianRupee, color: 'text-green-400', bg: 'hover:bg-green-500/5' },
                                            { id: 'vouchers' as TabId, label: 'Vouchers', icon: Ticket, color: 'text-amber-400', bg: 'hover:bg-amber-500/5' },
                                            { id: 'announcements' as TabId, label: 'Announcements', icon: Megaphone, color: 'text-cyan-400', bg: 'hover:bg-cyan-500/5' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleTabChange(item.id)}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] ${item.bg} transition-all text-left group`}
                                            >
                                                <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                                                <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors truncate">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Organization Graph */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-6 w-1 bg-red-600 rounded-full" />
                                        <h2 className="text-lg font-bold text-white">Organization Structure</h2>
                                    </div>
                                    <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-6 overflow-hidden">
                                        <OrganizationGraph users={stats.users} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><UserManagementTable /></Suspense></motion.div>}
                        {activeTab === 'belt-verifications' && <motion.div key="belt-verifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><BeltApprovalsView /></Suspense></motion.div>}
                        {activeTab === 'belt-promotions' && <motion.div key="belt-promotions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><BeltPromotionsView /></Suspense></motion.div>}
                        {activeTab === 'belt-exam-grading' && <motion.div key="belt-exam-grading" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><BeltExamGrading /></Suspense></motion.div>}
                        {activeTab === 'dojos' && <motion.div key="dojos" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><DojoManager /></Suspense></motion.div>}
                        {activeTab === 'events' && <motion.div key="events" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><EventManager /></Suspense></motion.div>}
                        {activeTab === 'seminars' && <motion.div key="seminars" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><SeminarManager /></Suspense></motion.div>}
                        {activeTab === 'tournaments' && <motion.div key="tournaments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><TournamentManager /></Suspense></motion.div>}
                        {activeTab === 'live-management' && <motion.div key="live-management" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><LiveMatchManager /></Suspense></motion.div>}
                        {activeTab === 'store' && <motion.div key="store" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><StoreManagement /></Suspense></motion.div>}
                        {activeTab === 'blogs' && <motion.div key="blogs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><BlogManager /></Suspense></motion.div>}
                        {activeTab === 'media' && <motion.div key="media" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><MediaManager /></Suspense></motion.div>}
                        {activeTab === 'recognition' && <motion.div key="recognition" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><RecognitionManager /></Suspense></motion.div>}
                        {activeTab === 'announcements' && <motion.div key="announcements" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><AnnouncementManager /></Suspense></motion.div>}
                        {activeTab === 'payments' && <motion.div key="payments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><PaymentManagement /></Suspense></motion.div>}
                        {activeTab === 'vouchers' && <motion.div key="vouchers" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><VoucherManager /></Suspense></motion.div>}
                    </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Student Detail View Modal */}
            {selectedStudentId && (
                <StudentDetailView
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}
        </div>
    );
}
