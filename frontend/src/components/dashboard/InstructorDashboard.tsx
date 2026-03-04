"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ClipboardCheck, Medal, ChevronRight, Search, Activity, FileText, Edit, Shield, BarChart, Menu, X, LogOut, Trophy, UserPlus, Ticket, FileCheck, KeyRound, ArrowRight, CalendarPlus, Calendar, MapPin, Tent, GraduationCap, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Link from "next/link";
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
import TournamentManager from "./TournamentManager";
import GlobalSearch from "./GlobalSearch";
import StudentDetailView from "./StudentDetailView";

export default function InstructorDashboard({ user }: { user: any }) {
    const { showToast } = useToast();
    const { logout } = useAuthStore();
    const [students, setStudents] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, pendingRes] = await Promise.all([
                    api.get('/users'), // Should return all students for this instructor
                    api.get('/users?status=PENDING') // Should return pending students
                ]);
                setStudents(studentsRes.data.data.users);
                setPendingStudents(pendingRes.data.data.users);
            } catch (error) {
                console.error("Failed to fetch instructor data", error);
            }
        };
        fetchData();
    }, []);

    const [approvingId, setApprovingId] = useState<string | null>(null);

    const handleApprove = async (id: string) => {
        if (approvingId) return; // Prevent double-click
        setApprovingId(id);
        try {
            await api.patch(`/users/${id}/approve`);
            showToast("Student approved successfully!", "success");
            // Refresh data
            const [studentsRes, pendingRes] = await Promise.all([
                api.get('/users'),
                api.get('/users?status=PENDING')
            ]);
            setStudents(studentsRes.data.data.users);
            setPendingStudents(pendingRes.data.data.users);
        } catch (error) {
            console.error("Failed to approve student", error);
            showToast("Failed to approve student", "error");
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.patch(`/users/${id}/reject`);
            showToast("Student rejected", "success");
            // Refresh data
            const [studentsRes, pendingRes] = await Promise.all([
                api.get('/users'),
                api.get('/users?status=PENDING')
            ]);
            setStudents(studentsRes.data.data.users);
            setPendingStudents(pendingRes.data.data.users);
        } catch (error) {
            console.error("Failed to reject student", error);
            showToast("Failed to reject student", "error");
        }
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'blogs' | 'submit' | 'belt-approvals' | 'belt-promotions' | 'belt-exam-grading' | 'tournaments' | 'register-student' | 'enroll-event'>('overview');

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'register-student', label: 'Register Student', icon: UserPlus },
        { id: 'enroll-event', label: 'Enroll in Event', icon: CalendarPlus },
        { id: 'belt-approvals', label: 'Belt Verifications', icon: ClipboardCheck },
        { id: 'belt-promotions', label: 'Belt Promotions', icon: Medal },
        { id: 'belt-exam-grading', label: 'Belt Exam Grading', icon: Shield },
        { id: 'students', label: 'Student Roster', icon: Users },
        { id: 'tournaments', label: 'Tournaments', icon: Trophy },
        { id: 'blogs', label: 'My Blogs', icon: FileText },
        { id: 'submit', label: 'Write Blog', icon: Edit },
    ];

    return (
        <div className="flex min-h-[80vh] bg-black/50 rounded-3xl border border-white/10 overflow-hidden relative">
            <RegisterStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                instructorDojoId={user?.dojoId}
                instructorDojoName={user?.dojo?.name}
                onSuccess={async () => {
                    try {
                        const [studentsRes, pendingRes] = await Promise.all([
                            api.get('/users'),
                            api.get('/users?status=PENDING')
                        ]);
                        setStudents(studentsRes.data.data.users);
                        setPendingStudents(pendingRes.data.data.users);
                    } catch {}
                }}
            />

            <EnrollStudentModal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
            />

            {/* Mobile Sidebar Toggle */}
            <button
                className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-white/10 rounded-lg text-white"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <motion.div
                className={`w-64 bg-black/80 backdrop-blur-xl border-r border-white/10 flex flex-col absolute lg:relative z-40 h-full transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-green-700 flex items-center justify-center shadow-lg shadow-orange-900/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-white tracking-tight leading-none">KYOKUSHIN</h2>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Instructor Panel</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                                ? 'bg-gradient-to-r from-orange-600 to-green-700 text-white shadow-lg shadow-orange-900/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-orange-400 hover:bg-orange-950/30 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-[80vh] relative">
                <div className="p-8 lg:p-10">
                    {/* Global Search */}
                    <div className="mb-8">
                        <GlobalSearch onResultClick={(userId) => setSelectedStudentId(userId)} />
                    </div>

                    <AnimatePresence mode="wait">

            {activeTab === 'overview' && (
                <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                >
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2">Instructor Dashboard</h1>
                        <p className="text-gray-400">OSU, Sensei {user?.name?.split(' ')[0]}! Manage your dojo and students.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Total Students", value: students.length, icon: Users, color: "text-blue-400" },
                            { label: "Pending Approvals", value: pendingStudents.length, icon: ClipboardCheck, color: "text-orange-400" },
                            { label: "Black Belts", value: students.filter(s => s.currentBeltRank?.includes('Black') || s.currentBeltRank?.includes('Dan')).length, icon: Medal, color: "text-yellow-400" },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-6 flex items-center justify-between group hover:bg-white/10 transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pending Approvals Section */}
                    {pendingStudents.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-primary" />
                                    Pending Approvals
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingStudents.map((student, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white">
                                                {student.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{student.name}</h4>
                                                <p className="text-xs text-gray-400">New Membership • <span className="text-primary">{new Date(student.createdAt).toLocaleDateString()}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(student.id)} disabled={approvingId === student.id}>{approvingId === student.id ? 'Approving...' : 'Approve'}</Button>
                                            <Button size="sm" variant="outline" className="h-8 border-red-500/50 text-red-500 hover:bg-red-950" onClick={() => handleReject(student.id)}>Reject</Button>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
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
                <motion.div
                    key="belt-approvals"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <BeltApprovalsView />
                </motion.div>
            )}

            {activeTab === 'belt-promotions' && (
                <motion.div
                    key="belt-promotions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <BeltPromotionsView />
                </motion.div>
            )}

            {activeTab === 'belt-exam-grading' && (
                <motion.div
                    key="belt-exam-grading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <BeltExamGrading />
                </motion.div>
            )}

            {activeTab === 'students' && (
                <motion.div
                    key="students"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-white mb-2">Student Roster</h1>
                        <p className="text-gray-400">View students who selected you as their instructor.</p>
                    </div>
                    <StudentRoster />
                </motion.div>
            )}

            {activeTab === 'tournaments' && (
                <motion.div
                    key="tournaments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <TournamentManager />
                </motion.div>
            )}

            {activeTab === 'blogs' && (
                <motion.div
                    key="blogs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-white mb-2">My Blogs</h1>
                        <p className="text-gray-400">Manage your published articles.</p>
                    </div>
                    <BlogManager />
                </motion.div>
            )}

            {activeTab === 'submit' && (
                <motion.div
                    key="submit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-white mb-2">Write New Blog</h1>
                        <p className="text-gray-400">Share your knowledge with the community.</p>
                    </div>
                    <BlogSubmission />
                </motion.div>
            )}
                </AnimatePresence>
                </div>
            </div>

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
