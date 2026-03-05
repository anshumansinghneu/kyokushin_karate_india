"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, CheckCircle, XCircle, MoreVertical, Shield, User, Users, Edit2, Save, X, Pencil, Mail, Calendar, UserPlus, Eye, ChevronLeft, ChevronRight, IndianRupee, Filter, ArrowUpDown, ChevronDown, MapPin, Phone, Ruler, Weight, Clock, Award, CreditCard, Heart, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';
import Portal from "@/components/ui/portal";
import { INDIAN_STATES, CITIES, COUNTRY_CODES, BELT_RANKS } from "@/lib/constants";
import StudentDetailView from "./StudentDetailView";

type SortField = 'name' | 'role' | 'membershipStatus' | 'currentBeltRank' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function UserManagementTable() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [dojos, setDojos] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 20;
    const [payments, setPayments] = useState<Record<string, any>>({});

    // Filter state
    const [filterRole, setFilterRole] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterBelt, setFilterBelt] = useState<string>("all");
    const [filterDojo, setFilterDojo] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);

    // Sort state
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editSection, setEditSection] = useState<'personal' | 'martial' | 'membership'>('personal');
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        role: "STUDENT",
        dojoId: "",
        primaryInstructorId: "",
        currentBeltRank: "White",
        membershipStatus: "PENDING",
        phone: "",
        countryCode: "+91",
        dateOfBirth: "",
        city: "",
        state: "",
        country: "India",
        height: "",
        weight: "",
        experienceYears: "",
        experienceMonths: "",
        membershipNumber: "",
        membershipStartDate: "",
        membershipEndDate: "",
        fatherName: "",
        fatherPhone: "",
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

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit: pageSize };
            if (filterRole !== 'all') params.role = filterRole;
            if (filterStatus !== 'all') params.status = filterStatus;

            const [usersRes, dojosRes, paymentsRes] = await Promise.all([
                api.get('/users', { params }),
                api.get('/dojos'),
                api.get('/payments/all').catch(() => ({ data: { data: { payments: [] } } }))
            ]);
            const fetchedUsers = usersRes.data.data.users;
            setUsers(fetchedUsers);
            setTotalUsers(usersRes.data.total || fetchedUsers.length);
            setTotalPages(usersRes.data.pages || Math.ceil((usersRes.data.total || fetchedUsers.length) / pageSize));
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
    }, [page, filterRole, filterStatus]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Client-side filtering for search, belt, dojo, and sorting
    useEffect(() => {
        let filtered = [...users];

        // Text search
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(lowerSearch) ||
                user.email.toLowerCase().includes(lowerSearch) ||
                (user.dojo?.name || "").toLowerCase().includes(lowerSearch)
            );
        }

        // Belt filter (client-side since backend doesn't support it)
        if (filterBelt !== 'all') {
            filtered = filtered.filter(user => user.currentBeltRank === filterBelt);
        }

        // Dojo filter (client-side)
        if (filterDojo !== 'all') {
            filtered = filtered.filter(user => user.dojoId === filterDojo);
        }

        // Sort
        filtered.sort((a, b) => {
            const aVal = (a[sortField] || '').toString().toLowerCase();
            const bVal = (b[sortField] || '').toString().toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortOrder === 'asc' ? cmp : -cmp;
        });

        setFilteredUsers(filtered);
    }, [search, users, filterBelt, filterDojo, sortField, sortOrder]);

    const paginatedUsers = filteredUsers;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Bulk actions
    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedUsers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedUsers.map(u => u.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => api.patch(`/users/${id}/approve`)));
            showToast(`${selectedIds.size} user(s) approved`, "success");
            setSelectedIds(new Set());
            fetchUsers();
        } catch {
            showToast("Some approvals failed", "error");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => api.patch(`/users/${id}/reject`)));
            showToast(`${selectedIds.size} user(s) rejected`, "success");
            setSelectedIds(new Set());
            fetchUsers();
        } catch {
            showToast("Some rejections failed", "error");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => api.delete(`/users/${id}`)));
            showToast(`${selectedIds.size} user(s) deleted`, "success");
            setSelectedIds(new Set());
            fetchUsers();
        } catch {
            showToast("Some deletions failed", "error");
        } finally {
            setIsBulkProcessing(false);
        }
    };

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
            showToast("User deleted successfully!", "success");
            fetchUsers();
            setDeleteId(null);
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to delete user";
            showToast(message, "error");
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
            membershipStatus: user.membershipStatus,
            phone: user.phone || "",
            countryCode: user.countryCode || "+91",
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
            city: user.city || "",
            state: user.state || "",
            country: user.country || "India",
            height: user.height?.toString() || "",
            weight: user.weight?.toString() || "",
            experienceYears: user.experienceYears?.toString() || "",
            experienceMonths: user.experienceMonths?.toString() || "",
            membershipNumber: user.membershipNumber || "",
            membershipStartDate: user.membershipStartDate ? new Date(user.membershipStartDate).toISOString().split('T')[0] : "",
            membershipEndDate: user.membershipEndDate ? new Date(user.membershipEndDate).toISOString().split('T')[0] : "",
            fatherName: user.fatherName || "",
            fatherPhone: user.fatherPhone || "",
        });
        setIsEditModalOpen(true);
    };

    // Get instructors for the edit modal dropdown
    const availableInstructors = users.filter(u => {
        if (u.role !== 'INSTRUCTOR' && u.role !== 'ADMIN') return false;
        // Don't show the user being edited as their own instructor
        if (editingUser && u.id === editingUser.id) return false;
        // If a dojo is selected, show instructors at that dojo + admin
        if (editFormData.dojoId) {
            return u.role === 'ADMIN' || u.dojoId === editFormData.dojoId;
        }
        // If no dojo, show all instructors + admin
        return true;
    });

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || isSaving) return;
        setIsSaving(true);
        try {
            const updateData: any = {
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
                dojoId: editFormData.dojoId || null,
                primaryInstructorId: editFormData.primaryInstructorId || null,
                currentBeltRank: editFormData.currentBeltRank,
                membershipStatus: editFormData.membershipStatus,
                phone: editFormData.phone || null,
                countryCode: editFormData.countryCode || "+91",
                dateOfBirth: editFormData.dateOfBirth || null,
                city: editFormData.city || null,
                state: editFormData.state || null,
                country: editFormData.country || "India",
                height: editFormData.height || null,
                weight: editFormData.weight || null,
                experienceYears: editFormData.experienceYears || null,
                experienceMonths: editFormData.experienceMonths || null,
                membershipNumber: editFormData.membershipNumber || null,
                membershipStartDate: editFormData.membershipStartDate || null,
                membershipEndDate: editFormData.membershipEndDate || null,
                fatherName: editFormData.fatherName || null,
                fatherPhone: editFormData.fatherPhone || null,
            };

            await api.patch(`/users/${editingUser.id}`, updateData);
            setIsEditModalOpen(false);
            setEditingUser(null);
            fetchUsers();
            showToast("User updated successfully!", "success");
        } catch (error: any) {
            console.error("Failed to update user", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update user.";
            showToast(errorMessage, "error");
        } finally {
            setIsSaving(false);
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
        <div className="space-y-6">
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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/30">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1.5 ml-[52px]">{totalUsers} total users</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            placeholder="Search users..."
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${showFilters ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-gray-500 border-white/[0.06] hover:text-white hover:bg-white/[0.04]'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 whitespace-nowrap"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create User
                    </button>
                </div>
            </div>

            {/* Filter Row */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="flex flex-wrap gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                            <select
                                value={filterRole}
                                onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-9 px-3 text-white text-sm focus:outline-none focus:border-cyan-500/30"
                            >
                                <option value="all">All Roles</option>
                                <option value="STUDENT">Student</option>
                                <option value="INSTRUCTOR">Instructor</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-9 px-3 text-white text-sm focus:outline-none focus:border-cyan-500/30"
                            >
                                <option value="all">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PENDING">Pending</option>
                                <option value="EXPIRED">Expired</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                            <select
                                value={filterBelt}
                                onChange={(e) => setFilterBelt(e.target.value)}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-9 px-3 text-white text-sm focus:outline-none focus:border-cyan-500/30"
                            >
                                <option value="all">All Belts</option>
                                {BELT_RANKS.map(belt => (
                                    <option key={belt} value={belt}>{belt}</option>
                                ))}
                            </select>
                            <select
                                value={filterDojo}
                                onChange={(e) => setFilterDojo(e.target.value)}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-9 px-3 text-white text-sm focus:outline-none focus:border-cyan-500/30"
                            >
                                <option value="all">All Dojos</option>
                                {dojos.map((dojo: any) => (
                                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                ))}
                            </select>
                            {(filterRole !== 'all' || filterStatus !== 'all' || filterBelt !== 'all' || filterDojo !== 'all') && (
                                <button
                                    onClick={() => { setFilterRole('all'); setFilterStatus('all'); setFilterBelt('all'); setFilterDojo('all'); setPage(1); }}
                                    className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-3 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                    >
                        <span className="text-sm text-blue-400 font-bold">{selectedIds.size} selected</span>
                        <div className="flex gap-2 ml-auto">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-400 hover:bg-green-500/20 h-8 text-xs"
                                onClick={handleBulkApprove}
                                disabled={isBulkProcessing}
                            >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-yellow-400 hover:bg-yellow-500/20 h-8 text-xs"
                                onClick={handleBulkReject}
                                disabled={isBulkProcessing}
                            >
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/20 h-8 text-xs"
                                onClick={handleBulkDelete}
                                disabled={isBulkProcessing}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                        </div>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-gray-400 hover:text-white ml-2"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="py-3 px-2 w-8">
                                <input
                                    type="checkbox"
                                    checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-white/20 bg-transparent accent-primary"
                                />
                            </th>
                            <th className="py-3 px-4 cursor-pointer hover:text-white select-none" onClick={() => handleSort('name')}>
                                <span className="flex items-center gap-1">User {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}</span>
                            </th>
                            <th className="py-3 px-4 hidden md:table-cell cursor-pointer hover:text-white select-none" onClick={() => handleSort('role')}>
                                <span className="flex items-center gap-1">Role {sortField === 'role' && <ArrowUpDown className="w-3 h-3" />}</span>
                            </th>
                            <th className="py-3 px-4 hidden lg:table-cell">Dojo</th>
                            <th className="py-3 px-4 hidden sm:table-cell cursor-pointer hover:text-white select-none" onClick={() => handleSort('currentBeltRank')}>
                                <span className="flex items-center gap-1">Belt {sortField === 'currentBeltRank' && <ArrowUpDown className="w-3 h-3" />}</span>
                            </th>
                            <th className="py-3 px-4 cursor-pointer hover:text-white select-none" onClick={() => handleSort('membershipStatus')}>
                                <span className="flex items-center gap-1">Status {sortField === 'membershipStatus' && <ArrowUpDown className="w-3 h-3" />}</span>
                            </th>
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
                                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group ${selectedIds.has(user.id) ? 'bg-blue-500/5' : ''}`}
                                >
                                    <td className="py-3 px-2 w-8">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(user.id)}
                                            onChange={() => toggleSelect(user.id)}
                                            className="rounded border-white/20 bg-transparent accent-primary"
                                        />
                                    </td>
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
                        Page {page} of {totalPages} ({totalUsers} total users)
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
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
                            >
                                {/* Header with user info banner */}
                                <div className="relative px-6 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-red-950/30 via-zinc-900/50 to-zinc-900/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                {editFormData.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{editFormData.name || 'Edit User'}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        editFormData.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                        editFormData.role === 'INSTRUCTOR' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                        'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                                                    }`}>
                                                        {editFormData.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                        {editFormData.role}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        editFormData.membershipStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                                        editFormData.membershipStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                                        editFormData.membershipStatus === 'EXPIRED' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                                        'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}>
                                                        {editFormData.membershipStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                                            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Belt rank visual indicator */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {BELT_RANKS.slice(0, 6).map(belt => (
                                                <div key={belt} title={belt}
                                                    className={`w-5 h-2 rounded-full transition-all ${
                                                        editFormData.currentBeltRank === belt ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-125' : 'opacity-40'
                                                    }`}
                                                    style={{ backgroundColor: belt === 'White' ? '#e5e5e5' : belt === 'Orange' ? '#f97316' : belt === 'Blue' ? '#3b82f6' : belt === 'Yellow' ? '#eab308' : belt === 'Green' ? '#22c55e' : '#78350f' }}
                                                />
                                            ))}
                                            {BELT_RANKS.filter(b => b.startsWith('Black')).length > 0 && (
                                                <div className={`px-2 h-2 rounded-full transition-all ${
                                                    editFormData.currentBeltRank.startsWith('Black') ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 bg-zinc-200' : 'bg-zinc-800 opacity-40'
                                                }`} />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 ml-1">{editFormData.currentBeltRank}</span>
                                    </div>
                                </div>

                                {/* Section Tabs */}
                                <div className="flex border-b border-white/10 bg-zinc-900/50">
                                    {([
                                        { key: 'personal' as const, label: 'Personal', icon: User },
                                        { key: 'martial' as const, label: 'Martial Arts', icon: Award },
                                        { key: 'membership' as const, label: 'Membership', icon: CreditCard },
                                    ]).map(tab => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setEditSection(tab.key)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${
                                                editSection === tab.key
                                                    ? 'text-white'
                                                    : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            {editSection === tab.key && (
                                                <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Scrollable Form Content */}
                                <form onSubmit={handleUpdateUser} className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-5">
                                        <AnimatePresence mode="wait">
                                            {/* === PERSONAL INFO SECTION === */}
                                            {editSection === 'personal' && (
                                                <motion.div key="personal" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <User className="w-3 h-3" /> Full Name
                                                            </Label>
                                                            <Input
                                                                value={editFormData.name}
                                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Mail className="w-3 h-3" /> Email
                                                            </Label>
                                                            <Input
                                                                value={editFormData.email}
                                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Phone className="w-3 h-3" /> Phone
                                                            </Label>
                                                            <div className="flex gap-2">
                                                                <select
                                                                    value={editFormData.countryCode}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, countryCode: e.target.value })}
                                                                    className="bg-black/40 border border-white/10 rounded-md h-10 px-2 text-white text-sm w-24 focus:border-red-500/50 transition-colors"
                                                                >
                                                                    {COUNTRY_CODES.map(c => (
                                                                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                                                    ))}
                                                                </select>
                                                                <Input
                                                                    value={editFormData.phone}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                                    className="bg-black/40 border-white/10 flex-1 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                    placeholder="9876543210"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3" /> Date of Birth
                                                            </Label>
                                                            <Input
                                                                type="date"
                                                                value={editFormData.dateOfBirth}
                                                                onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <MapPin className="w-3 h-3" /> State
                                                            </Label>
                                                            <select
                                                                value={editFormData.state}
                                                                onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value, city: '' })}
                                                                className="w-full bg-black/40 border border-white/10 rounded-md h-10 px-3 text-white text-sm focus:border-red-500/50 transition-colors"
                                                            >
                                                                <option value="">Select State</option>
                                                                {INDIAN_STATES.map(s => (
                                                                    <option key={s} value={s}>{s}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <MapPin className="w-3 h-3" /> City
                                                            </Label>
                                                            <select
                                                                value={editFormData.city}
                                                                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                                                className="w-full bg-black/40 border border-white/10 rounded-md h-10 px-3 text-white text-sm focus:border-red-500/50 transition-colors"
                                                            >
                                                                <option value="">Select City</option>
                                                                {(editFormData.state && CITIES[editFormData.state] ? CITIES[editFormData.state] : []).map((c: any) => (
                                                                    <option key={typeof c === 'string' ? c : c.name} value={typeof c === 'string' ? c : c.name}>
                                                                        {typeof c === 'string' ? c : c.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Ruler className="w-3 h-3" /> Height (cm)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={editFormData.height}
                                                                onChange={(e) => setEditFormData({ ...editFormData, height: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                placeholder="170"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Weight className="w-3 h-3" /> Weight (kg)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={editFormData.weight}
                                                                onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                placeholder="70"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Guardian info - collapsible */}
                                                    <div className="border border-white/5 rounded-xl p-4 bg-black/20">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                            <Heart className="w-3 h-3" /> Guardian / Parent Details
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs text-gray-400">Father/Guardian Name</Label>
                                                                <Input
                                                                    value={editFormData.fatherName}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                                                                    className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs text-gray-400">Father/Guardian Phone</Label>
                                                                <Input
                                                                    value={editFormData.fatherPhone}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, fatherPhone: e.target.value })}
                                                                    className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* === MARTIAL ARTS SECTION === */}
                                            {editSection === 'martial' && (
                                                <motion.div key="martial" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="space-y-4">
                                                    {/* Role selector - interactive cards */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                            <Shield className="w-3 h-3" /> Role
                                                        </Label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { val: 'STUDENT', label: 'Student', icon: User, color: 'zinc' },
                                                                { val: 'INSTRUCTOR', label: 'Instructor', icon: UserCheck, color: 'blue' },
                                                                { val: 'ADMIN', label: 'Admin', icon: Shield, color: 'purple' },
                                                            ].map(r => (
                                                                <button key={r.val} type="button"
                                                                    onClick={() => setEditFormData({ ...editFormData, role: r.val })}
                                                                    className={`p-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1.5 ${
                                                                        editFormData.role === r.val
                                                                            ? r.color === 'purple' ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10'
                                                                            : r.color === 'blue' ? 'border-blue-500 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/10'
                                                                            : 'border-zinc-500 bg-zinc-500/10 text-zinc-300'
                                                                            : 'border-white/10 bg-black/30 text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                                    }`}
                                                                >
                                                                    <r.icon className="w-5 h-5" />
                                                                    {r.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Status selector */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-gray-400 uppercase tracking-wide">Status</Label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[
                                                                { val: 'ACTIVE', label: 'Active', dot: 'bg-green-400' },
                                                                { val: 'PENDING', label: 'Pending', dot: 'bg-yellow-400' },
                                                                { val: 'EXPIRED', label: 'Expired', dot: 'bg-orange-400' },
                                                                { val: 'REJECTED', label: 'Rejected', dot: 'bg-red-400' },
                                                            ].map(s => (
                                                                <button key={s.val} type="button"
                                                                    onClick={() => setEditFormData({ ...editFormData, membershipStatus: s.val })}
                                                                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                                                        editFormData.membershipStatus === s.val
                                                                            ? 'border-white/30 bg-white/10 text-white'
                                                                            : 'border-white/10 bg-black/30 text-gray-500 hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                                    {s.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Belt Rank - visual selector */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                            <Award className="w-3 h-3" /> Belt Rank
                                                        </Label>
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {BELT_RANKS.map(belt => {
                                                                const isBlack = belt.startsWith('Black');
                                                                const color = belt === 'White' ? '#e5e5e5' : belt === 'Orange' ? '#f97316' : belt === 'Blue' ? '#3b82f6' : belt === 'Yellow' ? '#eab308' : belt === 'Green' ? '#22c55e' : belt === 'Brown' ? '#92400e' : '#1a1a1a';
                                                                const selected = editFormData.currentBeltRank === belt;
                                                                return (
                                                                    <button key={belt} type="button"
                                                                        onClick={() => setEditFormData({ ...editFormData, currentBeltRank: belt })}
                                                                        className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                                                            selected ? 'border-white/40 bg-white/10 text-white ring-1 ring-white/20' : 'border-white/10 bg-black/30 text-gray-500 hover:bg-white/5'
                                                                        }`}
                                                                    >
                                                                        <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20" style={{ backgroundColor: color }} />
                                                                        <span className="truncate">{isBlack ? belt.replace('Black ', '') : belt}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide">Dojo</Label>
                                                            <select
                                                                value={editFormData.dojoId}
                                                                onChange={(e) => {
                                                                    setEditFormData({ ...editFormData, dojoId: e.target.value, primaryInstructorId: "" });
                                                                }}
                                                                className="w-full bg-black/40 border border-white/10 rounded-md h-10 px-3 text-white text-sm focus:border-red-500/50 transition-colors"
                                                            >
                                                                <option value="">No Dojo</option>
                                                                {dojos.map((dojo: any) => (
                                                                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide">Instructor</Label>
                                                            <select
                                                                value={editFormData.primaryInstructorId}
                                                                onChange={(e) => setEditFormData({ ...editFormData, primaryInstructorId: e.target.value })}
                                                                className="w-full bg-black/40 border border-white/10 rounded-md h-10 px-3 text-white text-sm focus:border-red-500/50 transition-colors"
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

                                                    {/* Experience */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" /> Experience
                                                        </Label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    value={editFormData.experienceYears}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, experienceYears: e.target.value })}
                                                                    className="bg-black/40 border-white/10 pr-14 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                    min="0"
                                                                    placeholder="0"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">years</span>
                                                            </div>
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    value={editFormData.experienceMonths}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, experienceMonths: e.target.value })}
                                                                    className="bg-black/40 border-white/10 pr-16 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                                    min="0" max="11"
                                                                    placeholder="0"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">months</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* === MEMBERSHIP SECTION === */}
                                            {editSection === 'membership' && (
                                                <motion.div key="membership" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                            <CreditCard className="w-3 h-3" /> Membership Number
                                                        </Label>
                                                        <Input
                                                            value={editFormData.membershipNumber}
                                                            onChange={(e) => setEditFormData({ ...editFormData, membershipNumber: e.target.value })}
                                                            placeholder="e.g. KKFI-ADM-0001"
                                                            className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors font-mono"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3" /> Membership Start
                                                            </Label>
                                                            <Input
                                                                type="date"
                                                                value={editFormData.membershipStartDate}
                                                                onChange={(e) => setEditFormData({ ...editFormData, membershipStartDate: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3" /> Membership End
                                                            </Label>
                                                            <Input
                                                                type="date"
                                                                value={editFormData.membershipEndDate}
                                                                onChange={(e) => setEditFormData({ ...editFormData, membershipEndDate: e.target.value })}
                                                                className="bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Membership duration info */}
                                                    {editFormData.membershipStartDate && editFormData.membershipEndDate && (
                                                        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                                                            <p className="text-xs text-gray-400">
                                                                Duration: {(() => {
                                                                    const start = new Date(editFormData.membershipStartDate);
                                                                    const end = new Date(editFormData.membershipEndDate);
                                                                    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                                    if (days < 0) return <span className="text-red-400">Invalid (end before start)</span>;
                                                                    const months = Math.floor(days / 30);
                                                                    return <span className="text-white font-medium">{months} months ({days} days)</span>;
                                                                })()}
                                                            </p>
                                                            {new Date(editFormData.membershipEndDate) < new Date() && (
                                                                <p className="text-xs text-orange-400 mt-1">⚠ Membership has expired</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Sticky Footer */}
                                    <div className="sticky bottom-0 px-6 py-4 border-t border-white/10 bg-zinc-900/95 backdrop-blur flex items-center justify-between">
                                        <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                            Cancel
                                        </button>
                                        <Button type="submit" disabled={isSaving}
                                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50">
                                            {isSaving ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Saving...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Save className="w-4 h-4" /> Save Changes
                                                </span>
                                            )}
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
