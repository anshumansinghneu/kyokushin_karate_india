"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ClipboardCheck, Medal, ChevronRight, Search, Activity, FileText, Edit, Shield, BarChart, Menu, X, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useAuthStore } from "@/store/authStore";

import StudentRoster from "./StudentRoster";
import AddStudentModal from "./AddStudentModal";
import BlogManager from "./BlogManager";
import BlogSubmission from "./BlogSubmission";
import BeltApprovalsView from "./BeltApprovalsView";
import BeltPromotionsView from "./BeltPromotionsView";

export default function InstructorDashboard({ user }: { user: any }) {
    const { showToast } = useToast();
    const { logout } = useAuthStore();
    const [students, setStudents] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/users/${id}/approve`);
            // Refresh data
            const [studentsRes, pendingRes] = await Promise.all([
                api.get('/users'),
                api.get('/users?status=PENDING')
            ]);
            setStudents(studentsRes.data.data.users);
            setPendingStudents(pendingRes.data.data.users);
        } catch (error) {
            console.error("Failed to approve student", error);
        }
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'blogs' | 'submit' | 'belt-approvals' | 'belt-promotions'>('overview');

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'belt-approvals', label: 'Belt Verifications', icon: ClipboardCheck },
        { id: 'belt-promotions', label: 'Belt Promotions', icon: Medal },
        { id: 'students', label: 'Student Roster', icon: Users },
        { id: 'blogs', label: 'My Blogs', icon: FileText },
        { id: 'submit', label: 'Write Blog', icon: Edit },
    ];

    return (
        <div className="flex min-h-[80vh] bg-black/50 rounded-3xl border border-white/10 overflow-hidden relative">
            <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

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
                    <input
                        type="file"
                        id="instructor-profile-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const formData = new FormData();
                            formData.append('image', file);

                            try {
                                const uploadRes = await api.post('/upload', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                const imageUrl = uploadRes.data.data.url;
                                await api.patch('/users/updateMe', { profilePhotoUrl: imageUrl });
                                window.location.reload();
                            } catch (error) {
                                console.error("Failed to upload profile picture", error);
                                showToast("Failed to upload profile picture", "error");
                            }
                        }}
                    />
                    <Button
                        onClick={() => document.getElementById('instructor-profile-upload')?.click()}
                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 mb-2"
                    >
                        <Users className="w-4 h-4 mr-2" /> Update Photo
                    </Button>
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
                                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(student.id)}>Approve</Button>
                                            <Button size="sm" variant="outline" className="h-8 border-red-500/50 text-red-500 hover:bg-red-950">Reject</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            </motion.div>
                )}
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

            {activeTab === 'students' && (
                <motion.div
                    key="students"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2">Student Roster</h1>
                            <p className="text-gray-400">View and manage your students.</p>
                        </div>
                        <Button
                            className="bg-primary hover:bg-primary-dark text-white font-bold"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            + New Student
                        </Button>
                    </div>
                    <StudentRoster />
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
        </div>
    );
}

            {activeTab === 'blogs' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <BlogManager />
                </motion.div>
            )}

            {activeTab === 'submit' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <BlogSubmission />
                </motion.div>
            )}
        </div>
    );
}
