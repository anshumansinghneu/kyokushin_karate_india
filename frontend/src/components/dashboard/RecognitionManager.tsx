"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Trophy, Trash2, User, Medal, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    currentBeltRank: string;
    dojo?: {
        name: string;
    };
}

interface Recognition {
    id: string;
    type: 'INSTRUCTOR' | 'STUDENT';
    user: User;
}

export default function RecognitionManager() {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [recognitions, setRecognitions] = useState<{ instructors: Recognition[], students: Recognition[] }>({ instructors: [], students: [] });
    const [loading, setLoading] = useState(false);
    const [monthInfo, setMonthInfo] = useState({ month: 0, year: 0 });

    const fetchRecognitions = async () => {
        try {
            const response = await api.get('/recognitions');
            const data = response.data.data;
            setRecognitions({
                instructors: data.instructors,
                students: data.students
            });
            setMonthInfo({ month: data.month, year: data.year });
        } catch (error) {
            console.error("Failed to fetch recognitions", error);
        }
    };

    useEffect(() => {
        fetchRecognitions();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            // Search users endpoint needed. Using getAllUsers with filter for now if API supports it, 
            // or just fetching all and filtering client side if list is small.
            // Ideally we'd have a search endpoint. Let's assume /users?search=... or just fetch all and filter.
            // Given the userController, we can filter by role but not name search.
            // I'll fetch all users (or by role) and filter client side for this MVP.
            const response = await api.get('/users');
            const allUsers = response.data.data.users;
            const filtered = allUsers.filter((u: User) =>
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const assignUser = async (user: User, type: 'INSTRUCTOR' | 'STUDENT') => {
        try {
            await api.post('/recognitions', {
                userId: user.id,
                type,
                month: monthInfo.month,
                year: monthInfo.year
            });
            fetchRecognitions(); // Refresh list
            setSearchResults([]); // Clear search
            setSearchQuery("");
        } catch (error: any) {
            console.error("Failed to assign recognition", error);
            showToast(error.response?.data?.message || "Failed to assign recognition", "error");
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRemoveClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmRemove = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/recognitions/${deleteId}`);
            fetchRecognitions();
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to remove", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const monthName = new Date(monthInfo.year, monthInfo.month - 1).toLocaleString('default', { month: 'long' });

    return (
        <div className="space-y-8">
            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">Remove Recognition?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to remove this recognition?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemove}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">Monthly Recognition</h2>
                    <p className="text-gray-400">Manage Top Instructors and Students for <span className="text-white font-bold">{monthName} {monthInfo.year}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search & Assign Section */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-red-500" />
                        Find & Assign
                    </h3>

                    <div className="flex gap-4 mb-6">
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/50 border-white/10 text-white"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={loading} className="bg-red-600 hover:bg-red-700">
                            {loading ? "..." : "Search"}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {searchResults.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                                <div>
                                    <p className="font-bold text-white">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email} • {user.currentBeltRank} Belt</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10"
                                        onClick={() => assignUser(user, 'INSTRUCTOR')}
                                    >
                                        <Medal className="w-3 h-3 mr-1" /> Instr
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
                                        onClick={() => assignUser(user, 'STUDENT')}
                                    >
                                        <Trophy className="w-3 h-3 mr-1" /> Stu
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {searchResults.length === 0 && searchQuery && !loading && (
                            <p className="text-center text-gray-500 text-sm">No users found. Try a different search.</p>
                        )}
                    </div>
                </div>

                {/* Current Winners Section */}
                <div className="space-y-6">
                    {/* Instructors */}
                    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Medal className="w-5 h-5 text-yellow-500" />
                            Top Instructors ({recognitions.instructors.length}/2)
                        </h3>
                        <div className="space-y-3">
                            {recognitions.instructors.map(rec => (
                                <div key={rec.id} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                            {/* Ideally verify profilePhotoUrl exists */}
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">IMG</div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{rec.user.name}</p>
                                            <p className="text-xs text-gray-400">{rec.user.dojo?.name || "No Dojo"}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveClick(rec.id)}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {recognitions.instructors.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No instructors assigned yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Students */}
                    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-blue-500" />
                            Top Students ({recognitions.students.length}/2)
                        </h3>
                        <div className="space-y-3">
                            {recognitions.students.map(rec => (
                                <div key={rec.id} className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">IMG</div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{rec.user.name}</p>
                                            <p className="text-xs text-gray-400">{rec.user.currentBeltRank} Belt</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveClick(rec.id)}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {recognitions.students.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No students assigned yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
