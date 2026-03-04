"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, ClipboardCheck, Medal, ChevronRight, Activity, FileText, Edit, Shield,
    Menu, X, LogOut, Trophy, UserPlus, Ticket, FileCheck, KeyRound, ArrowRight,
    CalendarPlus, Calendar, Tent, GraduationCap, CheckCircle, AlertTriangle,
    PanelLeftClose, PanelLeftOpen, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthStore } from "@/store/authStore";

import StudentRoster from "./StudentRoster";
import RegisterStudentModal from "./RegisterStudentModal";
import EnrollStudentModal from "./EnrollStudentModal";
import BlogManager from "./BlogManager";
import BlogSubmission from "./BlogSubmission";
import BeltApprovalsView from "./BeltApprovalsView";
import BeltPromotionsView from "./BeltPromotionsView";
import BeltExamGrading from "./BeltExamGrading";
import TournamentViewer from "./TournamentViewer";
import GlobalSearch from "./GlobalSearch";
import StudentDetailView from "./StudentDetailView";

type TabId = 'overview' | 'students' | 'belt-approvals' | 'belt-promotions' | 'belt-exam-grading' | 'tournaments' | 'register-student' | 'enroll-event' | 'blogs' | 'submit';

const VALID_TABS: TabId[] = ['overview', 'students', 'belt-approvals', 'belt-promotions', 'belt-exam-grading', 'tournaments', 'register-student', 'enroll-event', 'blogs', 'submit'];

export default function InstructorDashboard({ user, initialTab }: { user: any; initialTab?: string }) {
    const { showToast } = useToast();
    const { logout } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [students, setStudents] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile overlay
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // desktop
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // URL-synced tab state
    const resolvedInitial = VALID_TABS.includes(initialTab as TabId) ? initialTab as TabId : 'overview';
    const [activeTab, setActiveTabState] = useState<TabId>(resolvedInitial);

    const setActiveTab = useCallback((tab: TabId) => {
        setActiveTabState(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    // Sync from URL on popstate / external navigation
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && VALID_TABS.includes(tabParam as TabId)) {
            setActiveTabState(tabParam as TabId);
        }
    }, [searchParams]);

    // Shared data refresh function
    const refreshData = useCallback(async () => {
        try {
            const [studentsRes, pendingRes] = await Promise.all([
                api.get('/users'),
                api.get('/users?status=PENDING')
            ]);
            setStudents(studentsRes.data.data.users);
            setPendingStudents(pendingRes.data.data.users);
        } catch (error) {
            console.error("Failed to fetch instructor data", error);
        }
    }, []);

    useEffect(() => { refreshData(); }, [refreshData]);

    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

    const handleApprove = async (id: string) => {
        if (approvingId) return;
        setApprovingId(id);
        try {
            await api.patch(`/users/${id}/approve`);
            showToast("Student approved successfully!", "success");
            await refreshData();
        } catch (error) {
            console.error("Failed to approve student", error);
            showToast("Failed to approve student", "error");
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (rejectingId) return;
        setRejectingId(id);
        try {
            await api.patch(`/users/${id}/reject`);
            showToast("Student rejected", "success");
            await refreshData();
        } catch (error) {
            console.error("Failed to reject student", error);
            showToast("Failed to reject student", "error");
        } finally {
            setRejectingId(null);
            setConfirmRejectId(null);
        }
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'students', label: 'Student Roster', icon: Users },
        { id: 'belt-approvals', label: 'Belt Verifications', icon: ClipboardCheck },
        { id: 'belt-promotions', label: 'Belt Promotions', icon: Medal },
        { id: 'belt-exam-grading', label: 'Belt Exam Grading', icon: Shield },
        { id: 'tournaments', label: 'Tournaments', icon: Trophy },
        { id: 'register-student', label: 'Register Student', icon: UserPlus },
        { id: 'enroll-event', label: 'Enroll in Event', icon: CalendarPlus },
        { id: 'blogs', label: 'My Blogs', icon: FileText },
        { id: 'submit', label: 'Write Blog', icon: Edit },
    ];

    const activeLabel = menuItems.find(i => i.id === activeTab)?.label || 'Overview';

    return (
        <div className="flex h-screen overflow-hidden">
            <RegisterStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                instructorDojoId={user?.dojoId}
                instructorDojoName={user?.dojo?.name}
                onSuccess={refreshData}
            />

            <EnrollStudentModal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
            />

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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-green-700 flex items-center justify-center shadow-lg shadow-orange-900/30 flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-black text-white tracking-tight leading-none">KYOKUSHIN</h2>
                            <p className="text-[9px] font-bold text-orange-400 uppercase tracking-[0.2em] mt-0.5">Instructor</p>
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                                title={isSidebarCollapsed ? item.label : undefined}
                                className={`
                                    w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all relative group
                                    ${isSidebarCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}
                                    ${isActive
                                        ? 'bg-orange-500/10 text-white'
                                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                                    }
                                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="instructorActiveTab"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-orange-500 rounded-r-full"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                            </button>
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:text-orange-400 hover:bg-orange-950/20 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
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
                                    onClick={() => setActiveTab('overview')}
                                    className={`font-medium transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Dashboard
                                </button>
                                {activeTab !== 'overview' && (
                                    <>
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
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-600 to-green-700 flex items-center justify-center text-[11px] font-bold text-white">
                                    {user?.name?.[0]?.toUpperCase() || 'I'}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-white leading-none">{user?.name?.split(' ')[0]}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Instructor</p>
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
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-400">Active</span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                            OSU, Sensei {user?.name?.split(' ')[0]}!
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your dojo and students.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                        {[
                            { label: "Total Students", value: students.length, icon: Users, color: "text-blue-400", iconBg: "bg-blue-500/10", border: "border-blue-500/10" },
                            { label: "Pending Approvals", value: pendingStudents.length, icon: ClipboardCheck, color: "text-orange-400", iconBg: "bg-orange-500/10", border: pendingStudents.length > 0 ? "border-orange-500/10" : "border-white/[0.06]" },
                            { label: "Black Belts", value: students.filter(s => s.currentBeltRank?.includes('Black') || s.currentBeltRank?.includes('Dan')).length, icon: Medal, color: "text-amber-400", iconBg: "bg-amber-500/10", border: "border-amber-500/10" },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`p-5 rounded-2xl border ${stat.border} bg-white/[0.015] transition-all duration-200`}
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
                            </motion.div>
                        ))}
                    </div>

                    {/* Pending Approvals Section */}
                    {pendingStudents.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <div className="h-5 w-1 bg-orange-500 rounded-full" />
                                    Pending Approvals
                                    <span className="ml-1 text-[10px] font-bold bg-orange-500/80 text-white px-1.5 py-0.5 rounded-full">{pendingStudents.length}</span>
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {pendingStudents.map((student, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-600/30 to-green-700/30 flex items-center justify-center text-sm font-bold text-white">
                                                {student.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{student.name}</h4>
                                                <p className="text-[11px] text-gray-500">New Membership &middot; {new Date(student.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(student.id)} disabled={approvingId === student.id}>{approvingId === student.id ? 'Approving...' : 'Approve'}</Button>
                                            {confirmRejectId === student.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs" onClick={() => handleReject(student.id)} disabled={rejectingId === student.id}>
                                                        {rejectingId === student.id ? 'Rejecting...' : 'Confirm'}
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 border-white/10 text-gray-400 text-xs" onClick={() => setConfirmRejectId(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="outline" className="h-8 border-red-500/50 text-red-500 hover:bg-red-950" onClick={() => setConfirmRejectId(student.id)}>Reject</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {activeTab === 'register-student' && (
                <motion.div
                    key="register-student"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-8"
                >
                    {/* Hero Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-white/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-black/60 to-green-700/20" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                        <div className="relative px-8 py-10 sm:px-10 sm:py-12">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-600 to-green-700 flex items-center justify-center shadow-2xl shadow-orange-900/30 flex-shrink-0">
                                    <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Register Student</h1>
                                    <p className="text-gray-400 text-sm sm:text-base max-w-xl">
                                        Register students who can&apos;t use the website themselves. You&apos;ll need a membership voucher code to complete the registration.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-green-700 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-900/30 hover:shadow-orange-900/50 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 group"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    <span>Register New Student</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* How It Works */}
                    <div>
                        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-green-600 rounded-full" />
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { step: "1", icon: UserPlus, title: "Student Info", desc: "Enter the student's name, email, phone and personal details" },
                                { step: "2", icon: Shield, title: "Belt & Details", desc: "Set their current belt rank, height, weight and experience" },
                                { step: "3", icon: FileCheck, title: "Location & Dojo", desc: "Select their state, city and assign them to your dojo" },
                                { step: "4", icon: Ticket, title: "Apply Voucher", desc: "Enter a valid membership voucher code to complete registration" },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600/20 to-green-700/20 border border-orange-500/20 flex items-center justify-center text-xs font-black text-orange-400 group-hover:from-orange-600/30 group-hover:to-green-700/30 transition-colors">
                                            {item.step}
                                        </div>
                                        <item.icon className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                                    {i < 3 && (
                                        <div className="hidden md:block absolute top-1/2 -right-2.5 w-5 text-gray-700">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Ticket className="w-5 h-5 text-amber-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white">About Vouchers</h3>
                            </div>
                            <ul className="space-y-2.5 text-xs text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                    Each voucher is single-use and covers the membership fee
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                    Voucher must be of type <span className="text-orange-400 font-semibold">MEMBERSHIP</span> or <span className="text-orange-400 font-semibold">ALL</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                    Contact an admin if you need new vouchers issued
                                </li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <KeyRound className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white">After Registration</h3>
                            </div>
                            <ul className="space-y-2.5 text-xs text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                    A temporary password is generated for the student
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                    Share the login email &amp; password with the student
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                    Student is auto-assigned to your dojo &amp; appears in your roster
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'enroll-event' && (
                <motion.div
                    key="enroll-event"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-8"
                >
                    {/* Hero Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-white/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-black/60 to-purple-700/20" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                        <div className="relative px-8 py-10 sm:px-10 sm:py-12">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-blue-900/30 flex-shrink-0">
                                    <CalendarPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Enroll Student in Event</h1>
                                    <p className="text-gray-400 text-sm sm:text-base max-w-xl">
                                        Register your students for upcoming tournaments, camps, and seminars. You can optionally use a voucher to cover the fee.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsEnrollModalOpen(true)}
                                    className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 group"
                                >
                                    <CalendarPlus className="w-5 h-5" />
                                    <span>Enroll Student</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* How It Works */}
                    <div>
                        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { step: "1", icon: Users, title: "Select Student", desc: "Choose an active student from your roster to enroll in an event" },
                                { step: "2", icon: Calendar, title: "Pick an Event", desc: "Browse upcoming tournaments, camps and seminars with open registration" },
                                { step: "3", icon: CheckCircle, title: "Confirm & Enroll", desc: "Review details, optionally apply a voucher, and confirm the enrollment" },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-700/20 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400 group-hover:from-blue-600/30 group-hover:to-purple-700/30 transition-colors">
                                            {item.step}
                                        </div>
                                        <item.icon className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-1/2 -right-2.5 w-5 text-gray-700">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Event Types Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: Trophy, title: "Tournaments", desc: "Competitive events with brackets for Kata and Kumite. Requires admin approval.", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
                            { icon: Tent, title: "Camps", desc: "Training camps and workshops. Auto-approved on enrollment.", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
                            { icon: GraduationCap, title: "Seminars", desc: "Educational seminars and grading events. Auto-approved on enrollment.", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center`}>
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {activeTab === 'belt-approvals' && (
                <motion.div key="belt-approvals" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <BeltApprovalsView />
                </motion.div>
            )}

            {activeTab === 'belt-promotions' && (
                <motion.div key="belt-promotions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <BeltPromotionsView />
                </motion.div>
            )}

            {activeTab === 'belt-exam-grading' && (
                <motion.div key="belt-exam-grading" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <BeltExamGrading />
                </motion.div>
            )}

            {activeTab === 'students' && (
                <motion.div
                    key="students"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                >
                    <StudentRoster />
                </motion.div>
            )}

            {activeTab === 'tournaments' && (
                <motion.div key="tournaments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <TournamentViewer />
                </motion.div>
            )}

            {activeTab === 'blogs' && (
                <motion.div key="blogs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <BlogManager />
                </motion.div>
            )}

            {activeTab === 'submit' && (
                <motion.div key="submit" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <BlogSubmission />
                </motion.div>
            )}
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
