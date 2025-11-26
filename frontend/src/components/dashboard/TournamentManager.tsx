"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, Plus, Calendar, MapPin, Users, Edit2, Trash2, 
    Eye, Medal, Target, Filter, Search, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";

interface Tournament {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    startDate: string;
    endDate: string;
    location: string;
    type: string;
    status: string;
    categories: any;
    registrationDeadline: string;
    maxParticipants: number | null;
    memberFee: number;
    nonMemberFee: number;
    _count?: {
        registrations: number;
        results: number;
    };
}

export default function TournamentManager() {
    const { showToast } = useToast();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        registrationDeadline: "",
        maxParticipants: "",
        memberFee: "",
        nonMemberFee: "",
        categories: [] as string[],
    });

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await api.get("/events?type=TOURNAMENT");
            setTournaments(res.data.data.events || []);
        } catch (error) {
            console.error("Failed to fetch tournaments:", error);
            showToast("Failed to load tournaments", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/events", {
                type: "TOURNAMENT",
                ...formData,
                maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
                memberFee: parseFloat(formData.memberFee),
                nonMemberFee: parseFloat(formData.nonMemberFee),
                categories: formData.categories.length > 0 ? formData.categories : null,
            });

            showToast("Tournament created successfully!", "success");
            setShowCreateModal(false);
            resetForm();
            fetchTournaments();
        } catch (error) {
            console.error("Failed to create tournament:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to create tournament", "error");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTournament) return;

        try {
            await api.patch(`/events/${editingTournament.id}`, {
                ...formData,
                maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
                memberFee: parseFloat(formData.memberFee),
                nonMemberFee: parseFloat(formData.nonMemberFee),
                categories: formData.categories.length > 0 ? formData.categories : null,
            });

            showToast("Tournament updated successfully!", "success");
            setEditingTournament(null);
            resetForm();
            fetchTournaments();
        } catch (error) {
            console.error("Failed to update tournament:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to update tournament", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tournament?")) return;

        try {
            await api.delete(`/events/${id}`);
            showToast("Tournament deleted successfully!", "success");
            fetchTournaments();
        } catch (error) {
            console.error("Failed to delete tournament:", error);
            showToast("Failed to delete tournament", "error");
        }
    };

    const openEditModal = (tournament: Tournament) => {
        setEditingTournament(tournament);
        setFormData({
            name: tournament.name,
            description: tournament.description || "",
            startDate: tournament.startDate.split('T')[0],
            endDate: tournament.endDate.split('T')[0],
            location: tournament.location || "",
            registrationDeadline: tournament.registrationDeadline.split('T')[0],
            maxParticipants: tournament.maxParticipants?.toString() || "",
            memberFee: tournament.memberFee.toString(),
            nonMemberFee: tournament.nonMemberFee.toString(),
            categories: Array.isArray(tournament.categories) ? tournament.categories : [],
        });
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            location: "",
            registrationDeadline: "",
            maxParticipants: "",
            memberFee: "",
            nonMemberFee: "",
            categories: [],
        });
    };

    const addCategory = () => {
        setFormData(prev => ({
            ...prev,
            categories: [...prev.categories, ""]
        }));
    };

    const updateCategory = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.map((cat, i) => i === index ? value : cat)
        }));
    };

    const removeCategory = (index: number) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.filter((_, i) => i !== index)
        }));
    };

    const filteredTournaments = tournaments.filter(tournament => {
        const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tournament.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || tournament.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "UPCOMING": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "ONGOING": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "COMPLETED": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
            case "CANCELLED": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Tournament Management
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Create and manage karate tournaments</p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tournament
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search tournaments..."
                        className="pl-10 bg-white/5 border-white/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                >
                    <option value="ALL">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400">Total Tournaments</p>
                    <p className="text-2xl font-bold text-white mt-1">{tournaments.length}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-sm text-blue-400">Upcoming</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                        {tournaments.filter(t => t.status === 'UPCOMING').length}
                    </p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-sm text-green-400">Ongoing</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                        {tournaments.filter(t => t.status === 'ONGOING').length}
                    </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-sm text-yellow-400">Completed</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                        {tournaments.filter(t => t.status === 'COMPLETED').length}
                    </p>
                </div>
            </div>

            {/* Tournament List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
                </div>
            ) : filteredTournaments.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tournaments found</p>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                        Create Your First Tournament
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.map((tournament, index) => (
                        <motion.div
                            key={tournament.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all group"
                        >
                            {/* Tournament Image */}
                            {tournament.imageUrl ? (
                                <div className="h-40 w-full bg-gradient-to-br from-yellow-900/20 to-red-900/20 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={getImageUrl(tournament.imageUrl)!}
                                        alt={tournament.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-40 w-full bg-gradient-to-br from-yellow-900/20 to-red-900/20 flex items-center justify-center">
                                    <Trophy className="w-16 h-16 text-yellow-500/50" />
                                </div>
                            )}

                            <div className="p-5">
                                {/* Status Badge */}
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-3 ${getStatusColor(tournament.status)}`}>
                                    {tournament.status}
                                </span>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-white mb-2">{tournament.name}</h3>

                                {/* Details */}
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                                    </div>
                                    {tournament.location && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>{tournament.location}</span>
                                        </div>
                                    )}
                                    {tournament._count && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Users className="w-4 h-4" />
                                            <span>{tournament._count.registrations} participants</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => openEditModal(tournament)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(tournament.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        size="sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(showCreateModal || editingTournament) && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-black/95 border border-white/10 rounded-2xl w-full max-w-2xl my-8"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">
                                    {editingTournament ? "Edit Tournament" : "Create Tournament"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingTournament(null);
                                        resetForm();
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <form onSubmit={editingTournament ? handleUpdate : handleCreate} className="p-6 space-y-4">
                                <div>
                                    <Label className="text-white">Tournament Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="bg-white/5 border-white/10 text-white mt-1"
                                        placeholder="e.g., National Kyokushin Championship 2025"
                                    />
                                </div>

                                <div>
                                    <Label className="text-white">Description</Label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white mt-1 min-h-[80px]"
                                        placeholder="Tournament description..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-white">Start Date *</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                            className="bg-white/5 border-white/10 text-white mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">End Date *</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                            className="bg-white/5 border-white/10 text-white mt-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-white">Location *</Label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                        className="bg-white/5 border-white/10 text-white mt-1"
                                        placeholder="City, State"
                                    />
                                </div>

                                <div>
                                    <Label className="text-white">Registration Deadline *</Label>
                                    <Input
                                        type="date"
                                        value={formData.registrationDeadline}
                                        onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                        required
                                        className="bg-white/5 border-white/10 text-white mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-white">Max Participants</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxParticipants}
                                            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white mt-1"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Member Fee *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.memberFee}
                                            onChange={(e) => setFormData({ ...formData, memberFee: e.target.value })}
                                            required
                                            className="bg-white/5 border-white/10 text-white mt-1"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Non-Member Fee *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.nonMemberFee}
                                            onChange={(e) => setFormData({ ...formData, nonMemberFee: e.target.value })}
                                            required
                                            className="bg-white/5 border-white/10 text-white mt-1"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-white">Categories</Label>
                                        <Button
                                            type="button"
                                            onClick={addCategory}
                                            className="bg-white/10 hover:bg-white/20 text-white text-xs"
                                            size="sm"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.categories.map((category, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={category}
                                                    onChange={(e) => updateCategory(index, e.target.value)}
                                                    className="bg-white/5 border-white/10 text-white"
                                                    placeholder="e.g., Men's -70kg Brown Belt"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => removeCategory(index)}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                    size="sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setEditingTournament(null);
                                            resetForm();
                                        }}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                    >
                                        {editingTournament ? "Update Tournament" : "Create Tournament"}
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
