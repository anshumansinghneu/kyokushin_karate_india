"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Edit2, Trash2, X, Save, Building, Search } from "lucide-react";
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
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Building className="w-6 h-6 text-green-500" /> Dojo Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{dojos.length} dojo{dojos.length !== 1 ? 's' : ''} registered</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Add New Dojo
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dojos by name, city, state or code..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
            </div>

            {dojos.length === 0 && !isLoading && (
                <div className="text-center py-16 glass-card">
                    <Building className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white">No dojos yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first dojo to get started.</p>
                    <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white mt-4">
                        <Plus className="w-4 h-4 mr-2" /> Add New Dojo
                    </Button>
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
                        className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
                    >
                        <div className="h-1 bg-green-500" />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingDojo ? 'Edit Dojo' : 'Create New Dojo'}
                                </h3>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Dojo Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Kyokushin Mumbai Central"
                                        required
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <select
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                                            required
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                        >
                                            <option value="" className="bg-zinc-900">Select State</option>
                                            {INDIAN_STATES.map((state) => (
                                                <option key={state} value={state} className="bg-zinc-900">{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <select
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            required
                                            disabled={!formData.state}
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                        >
                                            <option value="" className="bg-zinc-900">Select City</option>
                                            {formData.state && CITIES[formData.state]?.map((city) => (
                                                <option key={city} value={city} className="bg-zinc-900">{city}</option>
                                            ))}
                                            {formData.state && !CITIES[formData.state] && (
                                                <option value={formData.city} className="bg-zinc-900">Other</option>
                                            )}
                                        </select>
                                        {/* Fallback input if city not in list or state has no cities defined */}
                                        {formData.state && (!CITIES[formData.state] || CITIES[formData.state].length === 0) && (
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="Enter City"
                                                className="mt-2 bg-black/50 border-white/10"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full Address"
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Instructor <span className="text-red-500">*</span></Label>
                                    <select
                                        value={formData.instructorId}
                                        onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                        required
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                    >
                                        <option value="" className="bg-zinc-900">Select Instructor</option>
                                        {instructors.map((instructor) => (
                                            <option key={instructor.id} value={instructor.id} className="bg-zinc-900">
                                                {instructor.name} ({instructor.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                                        <Save className="w-4 h-4 mr-2" /> Save Dojo
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
