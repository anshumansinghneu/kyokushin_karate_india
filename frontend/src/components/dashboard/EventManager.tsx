"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Edit2, Trash2, X, Save, MapPin, Users, DollarSign, Search, Clock } from "lucide-react";
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
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'TOURNAMENT' | 'CAMP' | 'SEMINAR'>('ALL');
    const [searchQuery, setSearchQuery] = useState("");
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

    const handleOpenModal = async (event?: Event) => {
        if (event) {
            setEditingEvent(event);
            // Fetch full event details to get description
            let description = "";
            try {
                const res = await api.get(`/events/${event.id}`);
                description = res.data.data.event?.description || "";
            } catch {
                // Fallback: use empty description if fetch fails
            }
            setFormData({
                name: event.name,
                type: event.type,
                description,
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
                showToast("Event updated successfully!", "success");
            } else {
                await api.post('/events', payload);
                showToast("Event created successfully!", "success");
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
            showToast("Event deleted successfully!", "success");
        } catch (error) {
            console.error("Failed to delete event", error);
            showToast("Failed to delete event", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const getEventStatus = (event: Event) => {
        const now = new Date();
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (now < start) return 'upcoming' as const;
        if (now >= start && now <= end) return 'live' as const;
        return 'past' as const;
    };

    const typeAccent: Record<string, { bar: string; badge: string }> = {
        TOURNAMENT: { bar: 'bg-red-500', badge: 'bg-red-500/15 text-red-400 border border-red-500/30' },
        CAMP: { bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
        SEMINAR: { bar: 'bg-blue-500', badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    };

    const statusStyles: Record<string, { label: string; cls: string }> = {
        upcoming: { label: 'Upcoming', cls: 'bg-emerald-500/15 text-emerald-400' },
        live: { label: 'Live Now', cls: 'bg-red-500/15 text-red-400 animate-pulse' },
        past: { label: 'Completed', cls: 'bg-gray-500/15 text-gray-400' },
    };

    const filteredEvents = events.filter(event => {
        if (typeFilter !== 'ALL' && event.type !== typeFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return event.name.toLowerCase().includes(q) || event.location.toLowerCase().includes(q);
        }
        return true;
    });

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

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-red-500" /> Event Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events by name or location..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                    {(['ALL', 'TOURNAMENT', 'CAMP', 'SEMINAR'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                typeFilter === type
                                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
                            }`}
                        >
                            {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {filteredEvents.length === 0 && !isLoading && (
                <div className="text-center py-16 glass-card">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white">No events yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first event to get started.</p>
                    <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white mt-4">
                        <Plus className="w-4 h-4 mr-2" /> Create Event
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((event) => {
                    const status = getEventStatus(event);
                    const statusCfg = statusStyles[status];
                    const typeCfg = typeAccent[event.type] || typeAccent.TOURNAMENT;
                    const deadline = new Date(event.registrationDeadline);
                    const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
                        >
                            {/* Color accent bar */}
                            <div className={`h-1 ${typeCfg.bar}`} />

                            {/* Cover image */}
                            {event.imageUrl && (
                                <div className="relative h-36 overflow-hidden">
                                    <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>
                            )}

                            <div className="p-5">
                                {/* Header: Type + Status */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${typeCfg.badge}`}>
                                        {event.type}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusCfg.cls}`}>
                                        {statusCfg.label}
                                    </span>
                                </div>

                                {/* Title & date */}
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{event.name}</h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {event.startDate !== event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </p>

                                {/* Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{event.maxParticipants} Max</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>₹{event.memberFee}</span>
                                        {event.nonMemberFee > 0 && event.nonMemberFee !== event.memberFee && (
                                            <span className="text-gray-600">/ ₹{event.nonMemberFee} non-member</span>
                                        )}
                                    </div>
                                </div>

                                {/* Deadline */}
                                {status === 'upcoming' && daysUntilDeadline > 0 && (
                                    <div className={`mt-3 pt-3 border-t border-white/5 text-xs ${daysUntilDeadline <= 7 ? 'text-amber-400' : 'text-gray-500'}`}>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        Registration closes in {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                    <button
                                        onClick={() => handleOpenModal(event)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(event.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
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
                                            list="dojo-locations"
                                            placeholder="Start typing or select a dojo location..."
                                        />
                                        <datalist id="dojo-locations">
                                            {dojos.map(d => (
                                                <option key={d.id} value={d.name} />
                                            ))}
                                        </datalist>
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
