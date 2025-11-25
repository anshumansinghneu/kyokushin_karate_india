"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ClipboardCheck, Medal, ChevronRight, Search, Activity, FileText, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

import StudentRoster from "./StudentRoster";
import AddStudentModal from "./AddStudentModal";
import BlogManager from "./BlogManager";
import BlogSubmission from "./BlogSubmission";

export default function InstructorDashboard({ user }: { user: any }) {
    const { showToast } = useToast();
    const [students, setStudents] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'blogs' | 'submit'>('overview');

    return (
        <div className="space-y-8">
            <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6"
            >
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        OSU, <span className="text-primary">Sensei {user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your dojo and students.</p>
                </div>
                <div className="flex gap-3">
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
                        className="backdrop-blur-sm bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        <Users className="w-4 h-4 mr-2" /> Update Photo
                    </Button>
                    <Button
                        onClick={() => setActiveTab('overview')}
                        className={`backdrop-blur-sm border ${activeTab === 'overview' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Activity className="w-4 h-4 mr-2" /> Overview
                    </Button>
                    <Button
                        onClick={() => setActiveTab('students')}
                        className={`backdrop-blur-sm border ${activeTab === 'students' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Users className="w-4 h-4 mr-2" /> Students
                    </Button>
                    <Button
                        onClick={() => setActiveTab('blogs')}
                        className={`backdrop-blur-sm border ${activeTab === 'blogs' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <FileText className="w-4 h-4 mr-2" /> My Blogs
                    </Button>
                    <Button
                        onClick={() => setActiveTab('submit')}
                        className={`backdrop-blur-sm border ${activeTab === 'submit' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Edit className="w-4 h-4 mr-2" /> Write Blog
                    </Button>
                </div>
            </motion.div>

            {activeTab === 'overview' && (
                <div className="space-y-8">
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

            {activeTab === 'students' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex justify-end mb-4">
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
