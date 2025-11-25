"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, CheckCircle, XCircle, MoreVertical, Shield, User, Users, Edit2, Save, X, Pencil, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';

export default function UserManagementTable() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [dojos, setDojos] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        role: "STUDENT",
        dojoId: "",
        currentBeltRank: "White",
        membershipStatus: "PENDING"
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const [usersRes, dojosRes] = await Promise.all([
                api.get('/users'),
                api.get('/dojos')
            ]);
            setUsers(usersRes.data.data.users);
            setFilteredUsers(usersRes.data.data.users);
            setDojos(dojosRes.data.data.dojos);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(lowerSearch) ||
            user.email.toLowerCase().includes(lowerSearch) ||
            (user.dojo?.name || "").toLowerCase().includes(lowerSearch)
        );
        setFilteredUsers(filtered);
    }, [search, users]);

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/users/${id}/approve`);
            fetchUsers();
        } catch (error) {
            console.error("Failed to approve user", error);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.patch(`/users/${id}/reject`);
            fetchUsers();
        } catch (error) {
            console.error("Failed to reject user", error);
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/users/${deleteId}`);
            fetchUsers();
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete user", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            dojoId: user.dojoId || "",
            currentBeltRank: user.currentBeltRank || "White",
            membershipStatus: user.membershipStatus
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await api.patch(`/users/${editingUser.id}`, editFormData);
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Failed to update user", error);
            showToast("Failed to update user.", "error");
        }
    };

    return (
        <div className="glass-card p-6">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this user? This action cannot be undone.
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
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete User'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    User Management
                </h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 input-glass"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-gray-500 uppercase border-b border-white/10">
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Dojo</th>
                            <th className="py-3 px-4">Belt</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-300">
                        <AnimatePresence>
                            {filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-xs">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${user.role === 'ADMIN' ? 'border-red-500/50 text-red-400' :
                                            user.role === 'INSTRUCTOR' ? 'border-blue-500/50 text-blue-400' :
                                                'border-gray-500/50 text-gray-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.dojo?.name || <span className="text-gray-600 italic">None</span>}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.currentBeltRank}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.membershipStatus === 'PENDING' && user.isInstructorApproved ? (
                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/50">
                                                Instructor Approved
                                            </span>
                                        ) : (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.membershipStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                                user.membershipStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {user.membershipStatus}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20" onClick={() => openEditModal(user)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            {user.membershipStatus === 'PENDING' && (
                                                <>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20" onClick={() => handleApprove(user.id)}>
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => handleReject(user.id)}>
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteClick(user.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {filteredUsers.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Edit User</h3>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsEditModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <select
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                        >
                                            <option value="STUDENT">Student</option>
                                            <option value="INSTRUCTOR">Instructor</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            value={editFormData.membershipStatus}
                                            onChange={(e) => setEditFormData({ ...editFormData, membershipStatus: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="EXPIRED">Expired</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dojo</Label>
                                    <select
                                        value={editFormData.dojoId}
                                        onChange={(e) => setEditFormData({ ...editFormData, dojoId: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                    >
                                        <option value="">No Dojo</option>
                                        {dojos.map((dojo: any) => (
                                            <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Belt Rank</Label>
                                    <select
                                        value={editFormData.currentBeltRank}
                                        onChange={(e) => setEditFormData({ ...editFormData, currentBeltRank: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                    >
                                        {["White", "Orange", "Blue", "Yellow", "Green", "Brown", "Black"].map(belt => (
                                            <option key={belt} value={belt}>{belt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
