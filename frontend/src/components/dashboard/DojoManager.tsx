"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Edit2, Trash2, X, Save, Building, Search, Info, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';
import { INDIAN_STATES, CITIES } from "@/lib/constants";

interface Dojo {
    id: string;
    name: string;
    dojoCode: string;
    city: string;
    state: string;
    address: string;
}


export default function DojoManager() {
    const { showToast } = useToast();
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [editingDojo, setEditingDojo] = useState<Dojo | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        city: "",
        state: "",
        address: "",
        instructorId: ""
    });

    const [instructors, setInstructors] = useState<any[]>([]);

    const fetchDojos = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/dojos');
            setDojos(res.data.data.dojos);
        } catch (error) {
            console.error("Failed to fetch dojos", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInstructors = async () => {
        try {
            // Fetch both INSTRUCTOR and ADMIN roles
            const res = await api.get('/users?role=INSTRUCTOR,ADMIN');
            setInstructors(res.data.data.users);
        } catch (error) {
            console.error("Failed to fetch instructors", error);
        }
    };

    useEffect(() => {
        fetchDojos();
        fetchInstructors();
    }, []);

    const handleOpenModal = (dojo?: any) => {
        if (dojo) {
            setEditingDojo(dojo);
            setFormData({
                name: dojo.name,
                city: dojo.city,
                state: dojo.state || "",
                address: dojo.address || "",
                instructorId: dojo.instructors && dojo.instructors.length > 0 ? dojo.instructors[0].id : ""
            });
        } else {
            setEditingDojo(null);
            setFormData({
                name: "",
                city: "",
                state: "",
                address: "",
                instructorId: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingDojo) {
                await api.patch(`/dojos/${editingDojo.id}`, formData);
            } else {
                await api.post('/dojos', { ...formData, country: 'India' });
            }
            setIsModalOpen(false);
            fetchDojos();
            showToast(editingDojo ? "Dojo updated successfully" : "Dojo created successfully", "success");
        } catch (error) {
            console.error("Failed to save dojo", error);
            showToast("Failed to save dojo. Please check the inputs.", "error");
        } finally {
            setIsSaving(false);
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
            await api.delete(`/dojos/${deleteId}`);
            fetchDojos();
            setDeleteId(null);
            showToast("Dojo deleted successfully", "success");
        } catch (error) {
            console.error("Failed to delete dojo", error);
            showToast("Failed to delete dojo", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
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
                            <h3 className="text-xl font-bold text-white mb-2">Delete Dojo?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this Dojo? This action cannot be undone.
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
                                    {isDeleting ? 'Deleting...' : 'Delete Dojo'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                            <Building className="w-5 h-5 text-white" />
                        </div>
                        Dojo Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1.5 ml-[52px]">{dojos.length} dojo{dojos.length !== 1 ? 's' : ''} registered</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20">
                    <Plus className="w-4 h-4" /> Add New Dojo
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dojos by name, city, state or code..."
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-all"
                />
            </div>

            {dojos.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.08] rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/[0.06] flex items-center justify-center mb-4">
                        <Building className="w-8 h-8 text-emerald-500/40" />
                    </div>
                    <p className="text-gray-400 font-medium mb-1">No dojos yet</p>
                    <p className="text-gray-600 text-sm mb-4">Create your first dojo to get started</p>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
                        <Plus className="w-4 h-4" /> Add New Dojo
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dojos.filter(d => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q) || d.state.toLowerCase().includes(q) || d.dojoCode.toLowerCase().includes(q);
                }).map((dojo) => (
                    <motion.div
                        key={dojo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden bg-white/[0.01] hover:bg-white/[0.025] transition-all"
                    >
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-600" />
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-1">
                                <h3 className="text-lg font-bold text-white">{dojo.name}</h3>
                            </div>
                            <span className="inline-block text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md mb-3">{dojo.dojoCode}</span>

                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                <span>{dojo.city}, {dojo.state}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                <button
                                    onClick={() => handleOpenModal(dojo)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(dojo.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-8 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {editingDojo ? 'Edit Dojo' : 'Create New Dojo'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {editingDojo ? 'Update dojo details' : 'Register a new training location'}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(100vh-200px)]">
                                <div className="p-6 space-y-6">

                                    {/* Section: Basic Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <Building className="w-3.5 h-3.5" /> Dojo Information
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 mb-1.5 block">Dojo Name <span className="text-red-400">*</span></label>
                                            <input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Kyokushin Mumbai Central"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Section: Location */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <MapPin className="w-3.5 h-3.5" /> Location
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">State <span className="text-red-400">*</span></label>
                                                <select
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" className="bg-zinc-900">Select State</option>
                                                    {INDIAN_STATES.map((state) => (
                                                        <option key={state} value={state} className="bg-zinc-900">{state}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">City <span className="text-red-400">*</span></label>
                                                {formData.state && CITIES[formData.state]?.length > 0 ? (
                                                    <select
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                        required
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="" className="bg-zinc-900">Select City</option>
                                                        {CITIES[formData.state].map((city) => (
                                                            <option key={city} value={city} className="bg-zinc-900">{city}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                        placeholder={formData.state ? "Enter city" : "Select state first"}
                                                        disabled={!formData.state}
                                                        required
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 mb-1.5 block">Full Address</label>
                                            <input
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Street address, area, landmark..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Section: Instructor */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <User className="w-3.5 h-3.5" /> Primary Instructor
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 mb-1.5 block">Select Instructor <span className="text-red-400">*</span></label>
                                            <select
                                                value={formData.instructorId}
                                                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-zinc-900">Choose an instructor...</option>
                                                {instructors.map((inst) => (
                                                    <option key={inst.id} value={inst.id} className="bg-zinc-900">
                                                        {inst.name} ({inst.role})
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-gray-600 mt-1.5 flex items-center gap-1">
                                                <Info className="w-3 h-3" /> Only users with Instructor or Admin role appear here
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isSaving ? 'Saving...' : editingDojo ? 'Update Dojo' : 'Create Dojo'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
