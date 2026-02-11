"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, MapPin, Calendar, Settings, BarChart, Building, Image, FileText, Newspaper, LogOut, Menu, X, Trophy, Award, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

import UserManagementTable from "./UserManagementTable";
import DojoManager from "./DojoManager";
import EventManager from "./EventManager";
import ContentManagement from "./ContentManagement";
import BlogManager from "./BlogManager";
import MediaManager from "./MediaManager";
import RecognitionManager from "./RecognitionManager";
import OrganizationGraph from "./OrganizationGraph";
import BeltPromotionsView from "./BeltPromotionsView";
import BeltApprovalsView from "./BeltApprovalsView";
import TournamentManager from "./TournamentManager";
import GlobalSearch from "./GlobalSearch";
import StudentDetailView from "./StudentDetailView";
import AnnouncementManager from './AnnouncementManager';
import { useToast } from '@/contexts/ToastContext';

export default function AdminDashboard({ user }: { user: any }) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'dojos' | 'events' | 'users' | 'blogs' | 'media' | 'recognition' | 'content' | 'belt-verifications' | 'belt-promotions' | 'tournaments' | 'announcements'>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const { logout } = useAuthStore();
    const [stats, setStats] = useState({
        users: [] as any[],
        usersCount: 0,
        dojos: 0,
        events: 0,
        pending: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
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
            }
        };
        fetchStats();
    }, []);

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: BarChart },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'belt-verifications', label: 'Belt Verifications', icon: Shield },
        { id: 'belt-promotions', label: 'Belt Promotions', icon: Award },
        { id: 'dojos', label: 'Dojo Management', icon: Building },
        { id: 'events', label: 'Event Management', icon: Calendar },
        { id: 'tournaments', label: 'Tournaments', icon: Trophy },
        { id: 'blogs', label: 'Blogs', icon: FileText },
        { id: 'media', label: 'Media', icon: Newspaper },
        { id: 'recognition', label: 'Monthly Recognition', icon: Trophy },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
    ];

    return (
        <div className="flex min-h-[80vh] bg-black/50 rounded-3xl border border-white/10 overflow-hidden relative">
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
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-white tracking-tight leading-none">KYOKUSHIN</h2>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Admin Console</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
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
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
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
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h1 className="text-3xl font-black text-white mb-2">Dashboard Overview</h1>
                                        <p className="text-gray-400">Welcome back, Shihan. Here's what's happening today.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
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
                                            <BarChart className="w-4 h-4 mr-2" /> Export Report
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: "Total Users", value: stats.usersCount, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                                        { label: "Active Dojos", value: stats.dojos, icon: MapPin, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
                                        { label: "Upcoming Events", value: stats.events, icon: Calendar, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                                        { label: "Pending Verifications", value: stats.pending, icon: Shield, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
                                        >
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div>
                                                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${stat.color} opacity-80`}>{stat.label}</p>
                                                    <p className="text-4xl font-black text-white">{stat.value}</p>
                                                </div>
                                                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                                    <stat.icon className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-20 blur-3xl ${stat.color.replace('text-', 'bg-')}`} />
                                        </motion.div>
                                    ))}
                                </div>


                                {/* Organization Graph Section */}
                                <div className="mt-8">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="h-8 w-1 bg-red-600 rounded-full" />
                                        <h2 className="text-xl font-bold text-white">Organization Structure</h2>
                                    </div>
                                    <div className="bg-black/40 border border-white/10 rounded-3xl p-8 overflow-hidden">
                                        <OrganizationGraph users={stats.users} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><UserManagementTable /></motion.div>}
                        {activeTab === 'belt-verifications' && <motion.div key="belt-verifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><BeltApprovalsView /></motion.div>}
                        {activeTab === 'belt-promotions' && <motion.div key="belt-promotions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><BeltPromotionsView /></motion.div>}
                        {activeTab === 'dojos' && <motion.div key="dojos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><DojoManager /></motion.div>}
                        {activeTab === 'events' && <motion.div key="events" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><EventManager /></motion.div>}
                        {activeTab === 'tournaments' && <motion.div key="tournaments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><TournamentManager /></motion.div>}
                        {activeTab === 'blogs' && <motion.div key="blogs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><BlogManager /></motion.div>}
                        {activeTab === 'media' && <motion.div key="media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><MediaManager /></motion.div>}
                        {activeTab === 'recognition' && <motion.div key="recognition" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><RecognitionManager /></motion.div>}
                        {activeTab === 'announcements' && <motion.div key="announcements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><AnnouncementManager /></motion.div>}
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
        </div >
    );
}
