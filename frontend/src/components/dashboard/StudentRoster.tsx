"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical, Shield, User, Award, Calendar, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';
import { useAuthStore } from "@/store/authStore";

export default function StudentRoster() {
    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await api.get('/users');
                setStudents(response.data.data.users);
            } catch (error) {
                console.error("Failed to fetch students", error);
                showToast("Failed to fetch students", "error");
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(search.toLowerCase())
    );

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

    return (
        <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Student Roster
                </h3>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search students..."
                            className="pl-10 input-glass"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {!isInstructor && (
                        <Button onClick={() => setShowInviteModal(true)} className="bg-primary hover:bg-primary-dark text-white">
                            <Plus className="w-4 h-4 mr-2" /> Invite
                        </Button>
                    )}
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
                        <div className="flex items-start justify-between mb-4">
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
                                <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-white">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Award className="w-4 h-4" /> Rank
                                </span>
                                <span className="font-bold text-primary">{student.currentBeltRank || "White Belt"}</span>
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
        </div>
    );
}
