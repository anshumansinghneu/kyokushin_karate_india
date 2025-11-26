"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical, Shield, User, Award, Calendar, Plus, Check, Eye, Filter, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';
import { useAuthStore } from "@/store/authStore";
import StudentDetailView from "./StudentDetailView";

interface EnhancedStudent {
    id: string;
    name: string;
    email: string;
    currentBeltRank: string;
    membershipStatus: string;
    createdAt: string;
    daysSincePromotion?: number;
    isEligible?: boolean;
    trainingSessionCount?: number;
}

export default function StudentRoster() {
    const [students, setStudents] = useState<EnhancedStudent[]>([]);
    const [search, setSearch] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [showEligibleOnly, setShowEligibleOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'eligibility' | 'belt'>('name');
    const { showToast } = useToast();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // Fetch all users
                const response = await api.get('/users');
                const allUsers = response.data.data.users;

                // Enhance student data with eligibility info
                const enhancedStudents = await Promise.all(
                    allUsers.map(async (student: any) => {
                        if (student.role !== 'STUDENT') return null;

                        try {
                            // Fetch belt history for each student
                            const beltHistoryRes = await api.get(`/belts/history/${student.id}`);
                            const beltHistory = beltHistoryRes.data.data.beltHistory || [];

                            let daysSincePromotion = 0;
                            if (beltHistory.length > 0) {
                                const lastPromotion = new Date(beltHistory[0].promotionDate);
                                const now = new Date();
                                daysSincePromotion = Math.floor((now.getTime() - lastPromotion.getTime()) / (1000 * 60 * 60 * 24));
                            } else {
                                const joinDate = new Date(student.createdAt);
                                const now = new Date();
                                daysSincePromotion = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
                            }

                            return {
                                ...student,
                                daysSincePromotion,
                                isEligible: daysSincePromotion >= 180,
                                trainingSessionCount: student.trainingSessions?.length || 0,
                            };
                        } catch (error) {
                            return {
                                ...student,
                                daysSincePromotion: 0,
                                isEligible: false,
                                trainingSessionCount: 0,
                            };
                        }
                    })
                );

                setStudents(enhancedStudents.filter(s => s !== null) as EnhancedStudent[]);
            } catch (error) {
                console.error("Failed to fetch students", error);
                showToast("Failed to fetch students", "error");
            }
        };
        fetchStudents();
    }, []);

    let filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(search.toLowerCase());
        const matchesEligibility = !showEligibleOnly || student.isEligible;
        return matchesSearch && matchesEligibility;
    });

    // Sort students
    filteredStudents = filteredStudents.sort((a, b) => {
        if (sortBy === 'name') {
            return (a.name || '').localeCompare(b.name || '');
        } else if (sortBy === 'eligibility') {
            return (b.daysSincePromotion || 0) - (a.daysSincePromotion || 0);
        } else if (sortBy === 'belt') {
            const beltOrder: Record<string, number> = {
                'White': 0, 'Orange': 1, 'Blue': 2, 'Yellow': 3,
                'Green': 4, 'Brown': 5, 'Black': 6
            };
            const aBelt = beltOrder[a.currentBeltRank] || 0;
            const bBelt = beltOrder[b.currentBeltRank] || 0;
            return bBelt - aBelt;
        }
        return 0;
    });

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const { user } = useAuthStore();
    const isInstructor = user?.role === 'INSTRUCTOR';

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users/inviteUser', { email: inviteEmail, name: inviteName, role: 'STUDENT' });
            setShowInviteModal(false);
            setInviteEmail("");
            setInviteName("");
            showToast("Invitation sent!", "success");
            // Refresh list?
        } catch (error) {
            console.error("Failed to invite", error);
            showToast("Failed to invite student", "error");
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.post(`/users/${id}/approve`);
            // Refresh list
            const response = await api.get('/users');
            setStudents(response.data.data.users);
        } catch (error) {
            console.error("Failed to approve", error);
            alert("Failed to approve student");
        }
    };

    const eligibleCount = students.filter(s => s.isEligible).length;

    return (
        <div className="glass-card p-6">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Student Roster
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            {isInstructor ? 'View students who selected you as their primary instructor' : 'Manage all students in the system'}
                        </p>
                    </div>
                    {!isInstructor && (
                        <Button onClick={() => setShowInviteModal(true)} className="bg-primary hover:bg-primary-dark text-white">
                            <Plus className="w-4 h-4 mr-2" /> Invite Student
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Total Students</p>
                        <p className="text-2xl font-bold text-white">{students.length}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-xs text-green-400">Eligible</p>
                        <p className="text-2xl font-bold text-green-400">{eligibleCount}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-400">Active</p>
                        <p className="text-2xl font-bold text-blue-400">{students.filter(s => s.membershipStatus === 'ACTIVE').length}</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-xs text-yellow-400">Pending</p>
                        <p className="text-2xl font-bold text-yellow-400">{students.filter(s => s.membershipStatus === 'PENDING').length}</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search students..."
                            className="pl-10 input-glass"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setShowEligibleOnly(!showEligibleOnly)}
                        className={`${showEligibleOnly ? 'bg-green-600 hover:bg-green-700' : 'bg-white/5 hover:bg-white/10'} border border-white/10`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Eligible Only
                    </Button>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="eligibility">Sort by Eligibility</option>
                        <option value="belt">Sort by Belt Rank</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student, i) => (
                    <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-lg border-2 border-white/10">
                                    {student.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{student.name}</h4>
                                    <p className="text-xs text-gray-400">{student.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {student.membershipStatus === 'PENDING' && (
                                    <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/20" onClick={() => handleApprove(student.id)}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Eligibility Badge */}
                        {student.isEligible && (
                            <div className="mb-3 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-bold text-green-400">Eligible for Promotion</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Award className="w-4 h-4" /> Rank
                                </span>
                                <span className="font-bold text-primary">{student.currentBeltRank || "White Belt"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Since Promotion
                                </span>
                                <span className={`font-bold ${student.isEligible ? 'text-green-400' : student.daysSincePromotion && student.daysSincePromotion > 150 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                    {student.daysSincePromotion || 0} days
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> Status
                                </span>
                                <span className={`font-bold ${student.membershipStatus === 'ACTIVE' ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {student.membershipStatus}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Joined
                                </span>
                                <span className="text-gray-300">{new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                            onClick={() => setSelectedStudentId(student.id)}
                            className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                            size="sm"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </Button>

                        {/* Belt Color Indicator Strip */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1
                            ${(student.currentBeltRank || "").includes("Black") ? "bg-black" :
                                (student.currentBeltRank || "").includes("Brown") ? "bg-amber-800" :
                                    (student.currentBeltRank || "").includes("Green") ? "bg-green-600" :
                                        (student.currentBeltRank || "").includes("Yellow") ? "bg-yellow-500" :
                                            (student.currentBeltRank || "").includes("Blue") ? "bg-blue-500" :
                                                (student.currentBeltRank || "").includes("Orange") ? "bg-orange-500" :
                                                    "bg-white"
                            }
                        `} />
                    </motion.div>
                ))}
            </div>

            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Invite Student</h3>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Name</label>
                                <Input value={inviteName} onChange={e => setInviteName(e.target.value)} required className="bg-black/50 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Email</label>
                                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" required className="bg-black/50 border-white/10" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                                <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">Send Invite</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
