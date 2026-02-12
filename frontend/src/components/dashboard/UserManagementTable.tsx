"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, CheckCircle, XCircle, MoreVertical, Shield, User, Users, Edit2, Save, X, Pencil, Mail, Calendar, UserPlus, Eye, ChevronLeft, ChevronRight, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';
import Portal from "@/components/ui/portal";
import { INDIAN_STATES, CITIES, COUNTRY_CODES, BELT_RANKS } from "@/lib/constants";
import StudentDetailView from "./StudentDetailView";

export default function UserManagementTable() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [dojos, setDojos] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [payments, setPayments] = useState<Record<string, any>>({});

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        role: "STUDENT",
        dojoId: "",
        primaryInstructorId: "",
        currentBeltRank: "White",
        membershipStatus: "PENDING"
    });

    // Create User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT",
        countryCode: "+91",
        phone: "",
        dob: "",
        dojoId: "",
        currentBeltRank: "White",
        membershipStatus: "ACTIVE",
        city: "",
        state: "",
        height: "",
        weight: "",
        fatherName: "",
        fatherPhone: ""
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const [usersRes, dojosRes, paymentsRes] = await Promise.all([
                api.get('/users'),
                api.get('/dojos'),
                api.get('/payments/all').catch(() => ({ data: { data: { payments: [] } } }))
            ]);
            setUsers(usersRes.data.data.users);
            setFilteredUsers(usersRes.data.data.users);
            setDojos(dojosRes.data.data.dojos);

            // Build payment lookup by userId (latest payment)
            const paymentMap: Record<string, any> = {};
            (paymentsRes.data.data.payments || []).forEach((p: any) => {
                if (!paymentMap[p.user?.id] || new Date(p.createdAt) > new Date(paymentMap[p.user.id].createdAt)) {
                    paymentMap[p.user.id] = p;
                }
            });
            setPayments(paymentMap);
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
        setPage(1);
    }, [search, users]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

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
            primaryInstructorId: user.primaryInstructorId || "",
            currentBeltRank: user.currentBeltRank || "White",
            membershipStatus: user.membershipStatus
        });
        setIsEditModalOpen(true);
    };

    // Get instructors for the edit modal dropdown
    const availableInstructors = users.filter(u => {
        if (u.role !== 'INSTRUCTOR' && u.role !== 'ADMIN') return false;
        // If a dojo is selected, show instructors at that dojo + admin
        if (editFormData.dojoId) {
            return u.role === 'ADMIN' || u.dojoId === editFormData.dojoId;
        }
        // If no dojo, show all instructors + admin
        return true;
    });

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        console.log("Updating user:", editingUser.id, "with data:", editFormData);

        try {
            const updateData: any = {
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
                dojoId: editFormData.dojoId || null,
                primaryInstructorId: editFormData.primaryInstructorId || null,
                currentBeltRank: editFormData.currentBeltRank,
                membershipStatus: editFormData.membershipStatus
            };

            const res = await api.patch(`/users/${editingUser.id}`, updateData);
            console.log("Update user response:", res);
            setIsEditModalOpen(false);
            setEditingUser(null);
            fetchUsers();
            showToast("User updated successfully!", "success");
        } catch (error: any) {
            console.error("Failed to update user", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update user.";
            showToast(errorMessage, "error");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isCreating) return;

        // Validate
        const errs: Record<string, string> = {};
        if (!createFormData.name.trim()) errs.name = "Name is required";
        if (!createFormData.email) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) errs.email = "Invalid email";
        if (!createFormData.password) errs.password = "Password is required";
        else if (createFormData.password.length < 8) errs.password = "Min 8 characters";
        if (createFormData.password !== createFormData.confirmPassword) errs.confirmPassword = "Passwords do not match";
        if (!createFormData.phone) errs.phone = "Phone is required";
        if (!createFormData.dob) errs.dob = "Date of Birth is required";
        if (!createFormData.state) errs.state = "State is required";
        if (!createFormData.city) errs.city = "City is required";
        if (!createFormData.height) errs.height = "Height is required";
        if (!createFormData.weight) errs.weight = "Weight is required";
        if (createFormData.role === "STUDENT") {
            if (!createFormData.fatherName) errs.fatherName = "Required";
            if (!createFormData.fatherPhone) errs.fatherPhone = "Required";
        }
        if (Object.keys(errs).length > 0) {
            setCreateErrors(errs);
            return;
        }
        setCreateErrors({});
        setIsCreating(true);

        try {
            const { confirmPassword, ...payload } = createFormData;
            const res = await api.post("/users", payload);
            setIsCreateModalOpen(false);
            setCreateFormData({
                name: "", email: "", password: "", confirmPassword: "", role: "STUDENT",
                countryCode: "+91", phone: "", dob: "", dojoId: "",
                currentBeltRank: "White", membershipStatus: "ACTIVE",
                city: "", state: "", height: "", weight: "",
                fatherName: "", fatherPhone: ""
            });
            fetchUsers();
            const successMsg = res.data?.message || "User created successfully!";
            showToast(successMsg, "success");
        } catch (error: any) {
            console.error("Failed to create user", error);
            const message = error.response?.data?.message || error.message || "Failed to create user";
            showToast(message, "error");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="glass-card p-6">
            {/* Delete Confirmation Modal */}
            <Portal>
                <AnimatePresence>
                    {deleteId && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
            </Portal>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    User Management
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search users..."
                            className="pl-10 input-glass"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-white font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create User
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-gray-500 uppercase border-b border-white/10">
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4 hidden md:table-cell">Role</th>
                            <th className="py-3 px-4 hidden lg:table-cell">Dojo</th>
                            <th className="py-3 px-4 hidden sm:table-cell">Belt</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 hidden xl:table-cell">Payment</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-300">
                        <AnimatePresence>
                            {paginatedUsers.map((user) => (
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
                                    <td className="py-3 px-4 hidden md:table-cell">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${user.role === 'ADMIN' ? 'border-red-500/50 text-red-400' :
                                            user.role === 'INSTRUCTOR' ? 'border-blue-500/50 text-blue-400' :
                                                'border-gray-500/50 text-gray-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 hidden lg:table-cell">
                                        {user.dojo?.name || <span className="text-gray-600 italic">None</span>}
                                    </td>
                                    <td className="py-3 px-4 hidden sm:table-cell">
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
                                    <td className="py-3 px-4 hidden xl:table-cell">
                                        {(() => {
                                            const p = payments[user.id];
                                            if (!p) return <span className="text-xs text-gray-600 italic">No payment</span>;
                                            const isPaid = p.status === 'captured' || p.status === 'CAPTURED';
                                            return (
                                                <div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPaid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {isPaid ? '₹' + (p.amount / 100) : p.status.toUpperCase()}
                                                    </span>
                                                    <p className="text-[10px] text-gray-500 mt-1">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-purple-400 hover:bg-purple-500/20" onClick={() => setSelectedStudentId(user.id)} title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20" onClick={() => openEditModal(user)} title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            {user.membershipStatus === 'PENDING' && (
                                                <>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20" onClick={() => handleApprove(user.id)} title="Approve">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => handleReject(user.id)} title="Reject">
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteClick(user.id)} title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {paginatedUsers.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-gray-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            className="h-8 px-3 text-gray-400 hover:text-white"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <span className="flex items-center px-3 text-sm text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            className="h-8 px-3 text-gray-400 hover:text-white"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            <Portal>
                <AnimatePresence>
                    {isEditModalOpen && editingUser && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Edit2 className="w-5 h-5 text-primary" />
                                        Edit User
                                    </h3>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingUser(null);
                                    }}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Dojo</Label>
                                            <select
                                                value={editFormData.dojoId}
                                                onChange={(e) => {
                                                    const newDojoId = e.target.value;
                                                    // Reset instructor when dojo changes
                                                    setEditFormData({ ...editFormData, dojoId: newDojoId, primaryInstructorId: "" });
                                                }}
                                                className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                            >
                                                <option value="">No Dojo</option>
                                                {dojos.map((dojo: any) => (
                                                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Instructor</Label>
                                            <select
                                                value={editFormData.primaryInstructorId}
                                                onChange={(e) => setEditFormData({ ...editFormData, primaryInstructorId: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                            >
                                                <option value="">Direct under Shihan</option>
                                                {availableInstructors.map((inst: any) => (
                                                    <option key={inst.id} value={inst.id}>
                                                        {inst.name} {inst.role === 'ADMIN' ? '(Shihan)' : `(${inst.dojo?.name || 'No Dojo'})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    </div>

                                    <div className="pt-4 flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => {
                                            setIsEditModalOpen(false);
                                            setEditingUser(null);
                                        }}>Cancel</Button>
                                        <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                                            <Save className="w-4 h-4 mr-2" /> Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Create User Modal */}
            <Portal>
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-primary" />
                                        Create New User
                                    </h3>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsCreateModalOpen(false)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    {/* Role Selection */}
                                    <div className="space-y-2">
                                        <Label>Role *</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button type="button" onClick={() => setCreateFormData({ ...createFormData, role: "STUDENT" })}
                                                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                                                    createFormData.role === "STUDENT" ? "border-red-500 bg-red-500/10 text-white" : "border-white/10 bg-black/30 text-gray-400 hover:bg-white/5"
                                                }`}>
                                                <User className="w-4 h-4 inline mr-2" />Student
                                            </button>
                                            <button type="button" onClick={() => setCreateFormData({ ...createFormData, role: "INSTRUCTOR" })}
                                                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                                                    createFormData.role === "INSTRUCTOR" ? "border-red-500 bg-red-500/10 text-white" : "border-white/10 bg-black/30 text-gray-400 hover:bg-white/5"
                                                }`}>
                                                <Shield className="w-4 h-4 inline mr-2" />Instructor
                                            </button>
                                        </div>
                                    </div>

                                    {/* Personal Information Header */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Information</span>
                                    </div>

                                    {/* Name & Email */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Full Name *</Label>
                                            <Input value={createFormData.name}
                                                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.name ? 'border-red-500' : ''}`}
                                                placeholder="Enter full name" />
                                            {createErrors.name && <p className="text-xs text-red-400">{createErrors.name}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Email *</Label>
                                            <Input type="email" value={createFormData.email}
                                                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.email ? 'border-red-500' : ''}`}
                                                placeholder="user@email.com" />
                                            {createErrors.email && <p className="text-xs text-red-400">{createErrors.email}</p>}
                                        </div>
                                    </div>

                                    {/* Phone & DOB */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Phone Number *</Label>
                                            <div className="flex gap-2">
                                                <select value={createFormData.countryCode}
                                                    onChange={(e) => setCreateFormData({ ...createFormData, countryCode: e.target.value })}
                                                    className="w-24 bg-black/50 border border-white/10 rounded-md h-10 px-2 text-white text-sm">
                                                    {COUNTRY_CODES.map((c) => (
                                                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                                    ))}
                                                </select>
                                                <Input type="tel" value={createFormData.phone}
                                                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                                    className={`bg-black/50 border-white/10 flex-1 ${createErrors.phone ? 'border-red-500' : ''}`}
                                                    placeholder="9876543210" />
                                            </div>
                                            {createErrors.phone && <p className="text-xs text-red-400">{createErrors.phone}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Date of Birth *</Label>
                                            <Input type="date" value={createFormData.dob}
                                                onChange={(e) => setCreateFormData({ ...createFormData, dob: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.dob ? 'border-red-500' : ''}`} />
                                            {createErrors.dob && <p className="text-xs text-red-400">{createErrors.dob}</p>}
                                        </div>
                                    </div>

                                    {/* Belt Rank & Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Belt Rank</Label>
                                            <select value={createFormData.currentBeltRank}
                                                onChange={(e) => setCreateFormData({ ...createFormData, currentBeltRank: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white">
                                                {BELT_RANKS.map(belt => (
                                                    <option key={belt} value={belt}>{belt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Membership Status</Label>
                                            <select value={createFormData.membershipStatus}
                                                onChange={(e) => setCreateFormData({ ...createFormData, membershipStatus: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white">
                                                <option value="ACTIVE">Active</option>
                                                <option value="PENDING">Pending</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Height & Weight */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <Label>Height (cm) *</Label>
                                            <Input type="number" value={createFormData.height}
                                                onChange={(e) => setCreateFormData({ ...createFormData, height: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.height ? 'border-red-500' : ''}`}
                                                placeholder="170" min="50" max="250" />
                                            {createErrors.height && <p className="text-xs text-red-400">{createErrors.height}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Weight (kg) *</Label>
                                            <Input type="number" value={createFormData.weight}
                                                onChange={(e) => setCreateFormData({ ...createFormData, weight: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.weight ? 'border-red-500' : ''}`}
                                                placeholder="65" min="20" max="200" />
                                            {createErrors.weight && <p className="text-xs text-red-400">{createErrors.weight}</p>}
                                        </div>
                                    </div>

                                    {/* Location & Dojo Header */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location & Dojo</span>
                                    </div>

                                    {/* State & City */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>State *</Label>
                                            <select value={createFormData.state}
                                                onChange={(e) => setCreateFormData({ ...createFormData, state: e.target.value, city: "" })}
                                                className={`w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white ${createErrors.state ? 'border-red-500' : ''}`}>
                                                <option value="">Select State</option>
                                                {INDIAN_STATES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            {createErrors.state && <p className="text-xs text-red-400">{createErrors.state}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>City *</Label>
                                            <select value={createFormData.city}
                                                onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                                                className={`w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white ${createErrors.city ? 'border-red-500' : ''}`}
                                                disabled={!createFormData.state}>
                                                <option value="">Select City</option>
                                                {createFormData.state && CITIES[createFormData.state]?.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            {createErrors.city && <p className="text-xs text-red-400">{createErrors.city}</p>}
                                        </div>
                                    </div>

                                    {/* Dojo */}
                                    <div className="space-y-1">
                                        <Label>Dojo</Label>
                                        <select value={createFormData.dojoId}
                                            onChange={(e) => setCreateFormData({ ...createFormData, dojoId: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white">
                                            <option value="">No Dojo</option>
                                            {dojos.map((dojo: any) => (
                                                <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Guardian Info - Students Only */}
                                    {createFormData.role === "STUDENT" && (
                                        <>
                                            <div className="flex items-center gap-2 pt-2">
                                                <div className="w-1 h-4 bg-red-500 rounded-full" />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guardian Information</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label>Father&apos;s Name *</Label>
                                                    <Input value={createFormData.fatherName}
                                                        onChange={(e) => setCreateFormData({ ...createFormData, fatherName: e.target.value })}
                                                        className={`bg-black/50 border-white/10 ${createErrors.fatherName ? 'border-red-500' : ''}`}
                                                        placeholder="Father's Full Name" />
                                                    {createErrors.fatherName && <p className="text-xs text-red-400">{createErrors.fatherName}</p>}
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Father&apos;s Phone *</Label>
                                                    <div className="flex gap-2">
                                                        <span className="flex items-center px-3 bg-black/50 border border-white/10 rounded-md text-white text-sm">
                                                            {createFormData.countryCode}
                                                        </span>
                                                        <Input type="tel" value={createFormData.fatherPhone}
                                                            onChange={(e) => setCreateFormData({ ...createFormData, fatherPhone: e.target.value })}
                                                            className={`bg-black/50 border-white/10 flex-1 ${createErrors.fatherPhone ? 'border-red-500' : ''}`}
                                                            placeholder="9876543210" />
                                                    </div>
                                                    {createErrors.fatherPhone && <p className="text-xs text-red-400">{createErrors.fatherPhone}</p>}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Account Security Header */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Security</span>
                                    </div>

                                    {/* Password & Confirm */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Password * (min 8 chars)</Label>
                                            <Input type="password" value={createFormData.password}
                                                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.password ? 'border-red-500' : ''}`}
                                                placeholder="Min. 8 characters" />
                                            {createErrors.password && <p className="text-xs text-red-400">{createErrors.password}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Confirm Password *</Label>
                                            <Input type="password" value={createFormData.confirmPassword}
                                                onChange={(e) => setCreateFormData({ ...createFormData, confirmPassword: e.target.value })}
                                                className={`bg-black/50 border-white/10 ${createErrors.confirmPassword ? 'border-red-500' : ''}`}
                                                placeholder="Re-enter password" />
                                            {createErrors.confirmPassword && <p className="text-xs text-red-400">{createErrors.confirmPassword}</p>}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500">The user will receive an email with their login credentials.</p>

                                    <div className="pt-4 flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>Cancel</Button>
                                        <Button type="submit" className="bg-primary hover:bg-primary-dark text-white" disabled={isCreating}>
                                            {isCreating ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                    Creating...
                                                </span>
                                            ) : (
                                                <><UserPlus className="w-4 h-4 mr-2" /> Create User</>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

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
