"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Edit2, Trash2, X, Save, MapPin, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Event {
    id: string;
    name: string;
    type: 'TOURNAMENT' | 'CAMP' | 'SEMINAR';
    startDate: string;
    endDate: string;
    location: string;
    registrationDeadline: string;
    maxParticipants: number;
    memberFee: number;
    nonMemberFee: number;
    dojoId?: string;
    dojo?: { name: string };
    imageUrl?: string;
}

interface Dojo {
    id: string;
    name: string;
}

export default function EventManager() {
    const { showToast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "TOURNAMENT",
        description: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
        location: "",
        dojoId: "",
        registrationDeadline: "",
        maxParticipants: 100,
        memberFee: 0,
        nonMemberFee: 0,
        categories: [] // Simplified for now
    });

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const [eventsRes, dojosRes] = await Promise.all([
                api.get('/events'),
                api.get('/dojos')
            ]);
            setEvents(eventsRes.data.data.events);
            setDojos(dojosRes.data.data.dojos);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleOpenModal = (event?: Event) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name: event.name,
                type: event.type,
                description: "", // Fetch full details if needed
                imageUrl: event.imageUrl || "",
                startDate: new Date(event.startDate).toISOString().split('T')[0],
                endDate: new Date(event.endDate).toISOString().split('T')[0],
                location: event.location,
                dojoId: event.dojoId || "",
                registrationDeadline: new Date(event.registrationDeadline).toISOString().split('T')[0],
                maxParticipants: event.maxParticipants,
                memberFee: event.memberFee,
                nonMemberFee: event.nonMemberFee,
                categories: []
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name: "",
                type: "TOURNAMENT",
                description: "",
                imageUrl: "",
                startDate: "",
                endDate: "",
                location: "",
                dojoId: "",
                registrationDeadline: "",
                maxParticipants: 100,
                memberFee: 0,
                nonMemberFee: 0,
                categories: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
                maxParticipants: Number(formData.maxParticipants),
                memberFee: Number(formData.memberFee),
                nonMemberFee: Number(formData.nonMemberFee)
            };

            if (editingEvent) {
                await api.patch(`/events/${editingEvent.id}`, payload);
            } else {
                await api.post('/events', payload);
            }
            setIsModalOpen(false);
            fetchEvents();
        } catch (error) {
            console.error("Failed to save event", error);
            showToast("Failed to save event. Please check inputs.", "error");
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
            await api.delete(`/events/${deleteId}`);
            fetchEvents();
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete event", error);
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
                            <h3 className="text-xl font-bold text-white mb-2">Delete Event?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this event? This action cannot be undone.
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
                                    {isDeleting ? 'Deleting...' : 'Delete Event'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-primary" /> Event Management
                </h2>
                <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 relative group"
                    >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20" onClick={() => handleOpenModal(event)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20" onClick={() => handleDeleteClick(event.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${event.type === 'TOURNAMENT' ? 'border-red-500 text-red-400' : 'border-blue-500 text-blue-400'
                                }`}>
                                {event.type}
                            </span>
                            <span className="text-xs text-gray-500">
                                {new Date(event.startDate).toLocaleDateString()}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1 truncate">{event.name}</h3>

                        <div className="space-y-2 text-sm text-gray-400 mt-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {event.maxParticipants} Max
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                ₹{event.memberFee}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl shadow-2xl my-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                                </h3>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Event Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                        >
                                            <option value="TOURNAMENT">Tournament</option>
                                            <option value="CAMP">Camp</option>
                                            <option value="SEMINAR">Seminar</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-white min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Cover Image</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const uploadData = new FormData();
                                                uploadData.append('image', file);
                                                try {
                                                    const res = await api.post('/upload', uploadData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    setFormData({ ...formData, imageUrl: res.data.data.url });
                                                } catch (err) {
                                                    console.error("Upload failed", err);
                                                    showToast("Failed to upload image", "error");
                                                }
                                            }}
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    {formData.imageUrl && (
                                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 mt-2">
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500/50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deadline</Label>
                                        <Input
                                            type="date"
                                            value={formData.registrationDeadline}
                                            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            required
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Host Dojo</Label>
                                        <select
                                            value={formData.dojoId}
                                            onChange={(e) => setFormData({ ...formData, dojoId: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white"
                                        >
                                            <option value="">Select Dojo...</option>
                                            {dojos.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Max Participants</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxParticipants}
                                            onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Member Fee (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.memberFee}
                                            onChange={(e) => setFormData({ ...formData, memberFee: Number(e.target.value) })}
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Non-Member Fee (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.nonMemberFee}
                                            onChange={(e) => setFormData({ ...formData, nonMemberFee: Number(e.target.value) })}
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                                        <Save className="w-4 h-4 mr-2" /> Save Event
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
