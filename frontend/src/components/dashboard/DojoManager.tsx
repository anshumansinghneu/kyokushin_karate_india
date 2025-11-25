"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Edit2, Trash2, X, Save, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';

interface Dojo {
    id: string;
    name: string;
    dojoCode: string;
    city: string;
    state: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
}

export default function DojoManager() {
    const { showToast } = useToast();
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDojo, setEditingDojo] = useState<Dojo | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        dojoCode: "",
        city: "",
        state: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
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
            const res = await api.get('/users?role=INSTRUCTOR');
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
                dojoCode: dojo.dojoCode,
                city: dojo.city,
                state: dojo.state,
                address: dojo.address || "",
                contactEmail: dojo.contactEmail || "",
                contactPhone: dojo.contactPhone || "",
                instructorId: dojo.instructors && dojo.instructors.length > 0 ? dojo.instructors[0].id : ""
            });
        } else {
            setEditingDojo(null);
            setFormData({
                name: "",
                dojoCode: "",
                city: "",
                state: "",
                address: "",
                contactEmail: "",
                contactPhone: "",
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
                await api.post('/dojos', formData);
            }
            setIsModalOpen(false);
            fetchDojos();
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

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Building className="text-primary" /> Dojo Management
                </h2>
                <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add New Dojo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dojos.map((dojo) => (
                    <motion.div
                        key={dojo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 relative group"
                    >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20" onClick={() => handleOpenModal(dojo)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20" onClick={() => handleDeleteClick(dojo.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{dojo.name}</h3>
                        <p className="text-sm text-primary font-mono mb-4">{dojo.dojoCode}</p>

                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {dojo.city}, {dojo.state}
                            </div>
                            {dojo.contactEmail && (
                                <div className="truncate">{dojo.contactEmail}</div>
                            )}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Code</Label>
                                        <Input
                                            value={formData.dojoCode}
                                            onChange={(e) => setFormData({ ...formData, dojoCode: e.target.value })}
                                            placeholder="MUM-01"
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Mumbai"
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="Maharashtra"
                                        required
                                        className="bg-black/50 border-white/10"
                                    />
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                            placeholder="contact@dojo.com"
                                            type="email"
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                            placeholder="+91..."
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
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
                                                {instructor.name} ({instructor.email})
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
