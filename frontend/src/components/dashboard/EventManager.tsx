"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Edit2, Trash2, X, Save, MapPin, Users, DollarSign, Search, Clock, Trophy, Tent, BookOpen, ImagePlus, Info, IndianRupee, CalendarClock, Loader2, Tag, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Event {
    id: string;
    name: string;
    type: 'TOURNAMENT' | 'CAMP' | 'SEMINAR';
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'DRAFT' | 'CANCELLED';
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
    categories?: { name: string; age: string; weight: string }[];
}

interface CategoryRow {
    name: string;
    age: string;
    weight: string;
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
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "TOURNAMENT",
        status: "UPCOMING" as string,
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
        categories: [] as CategoryRow[]
    });

    // Smart auto-fill: when start date changes, auto-set end date (+1 day) and deadline (-7 days)
    const handleStartDateChange = (startDate: string) => {
        const updates: Partial<typeof formData> = { startDate };
        if (startDate) {
            const d = new Date(startDate);
            // Auto-fill end date = start + 1 day (if end date is empty or before new start)
            if (!formData.endDate || new Date(formData.endDate) < d) {
                const end = new Date(d);
                end.setDate(end.getDate() + 1);
                updates.endDate = end.toISOString().split('T')[0];
            }
            // Auto-fill deadline = start - 7 days (if deadline is empty)
            if (!formData.registrationDeadline) {
                const deadline = new Date(d);
                deadline.setDate(deadline.getDate() - 7);
                updates.registrationDeadline = deadline.toISOString().split('T')[0];
            }
        }
        setFormData(prev => ({ ...prev, ...updates }));
    };

    // Auto-fill location when selecting a host dojo
    const handleDojoChange = (dojoId: string) => {
        setFormData(prev => {
            const dojo = dojos.find(d => d.id === dojoId);
            return { ...prev, dojoId, location: dojo ? dojo.name : prev.location };
        });
    };

    const typeOptions = [
        { value: 'TOURNAMENT', label: 'Tournament', icon: Trophy, color: 'red' },
        { value: 'CAMP', label: 'Camp', icon: Tent, color: 'emerald' },
        { value: 'SEMINAR', label: 'Seminar', icon: BookOpen, color: 'blue' },
    ] as const;

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
            // Fetch full event details to get description + categories
            let description = "";
            let cats: CategoryRow[] = [];
            try {
                const res = await api.get(`/events/${event.id}`);
                const fullEvent = res.data.data.event;
                description = fullEvent?.description || "";
                cats = Array.isArray(fullEvent?.categories) ? fullEvent.categories : [];
            } catch {
                // Fallback: use empty description/categories if fetch fails
            }
            setFormData({
                name: event.name,
                type: event.type,
                status: event.status || 'UPCOMING',
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
                categories: cats
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name: "",
                type: "TOURNAMENT",
                status: "UPCOMING",
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
        setIsSaving(true);
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
        // Use the actual status from DB if available
        const s = event.status;
        if (s === 'DRAFT') return 'draft' as const;
        if (s === 'CANCELLED') return 'cancelled' as const;
        if (s === 'COMPLETED') return 'past' as const;
        if (s === 'ONGOING') return 'live' as const;
        // Fallback: compute from dates for UPCOMING
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
        draft: { label: 'Draft', cls: 'bg-yellow-500/15 text-yellow-400' },
        cancelled: { label: 'Cancelled', cls: 'bg-orange-500/15 text-orange-400 line-through' },
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
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {editingEvent ? 'Edit Event' : 'Create New Event'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {editingEvent ? 'Update event details below' : 'Fill in the details to create a new event'}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(100vh-200px)]">
                                <div className="p-6 space-y-6">

                                    {/* Section: Event Type - visual selector */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Event Type</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {typeOptions.map(opt => {
                                                const Icon = opt.icon;
                                                const isActive = formData.type === opt.value;
                                                const colorMap: Record<string, { active: string; ring: string; icon: string }> = {
                                                    red: { active: 'bg-red-500/15 border-red-500/50', ring: 'ring-red-500/30', icon: 'text-red-400' },
                                                    emerald: { active: 'bg-emerald-500/15 border-emerald-500/50', ring: 'ring-emerald-500/30', icon: 'text-emerald-400' },
                                                    blue: { active: 'bg-blue-500/15 border-blue-500/50', ring: 'ring-blue-500/30', icon: 'text-blue-400' },
                                                };
                                                const c = colorMap[opt.color];
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, type: opt.value })}
                                                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                                                            isActive ? `${c.active} ring-2 ${c.ring}` : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                                                        }`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${isActive ? c.icon : 'text-gray-500'}`} />
                                                        <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{opt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Section: Basic Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <Info className="w-3.5 h-3.5" /> Basic Information
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 mb-1.5 block">Event Name <span className="text-red-400">*</span></label>
                                            <input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="e.g. KKFI Inter-Dojo Championship 2026"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 mb-1.5 block">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                placeholder="Brief description of the event..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Section: Cover Image */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <ImagePlus className="w-3.5 h-3.5" /> Cover Image
                                        </div>
                                        {formData.imageUrl ? (
                                            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                                                <img src={formData.imageUrl} alt="Cover" className="w-full h-40 object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <label className="cursor-pointer px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-sm text-white hover:bg-white/30 transition-colors">
                                                        Change
                                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const uploadData = new FormData();
                                                            uploadData.append('image', file);
                                                            try {
                                                                const res = await api.post('/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                setFormData({ ...formData, imageUrl: res.data.data.url });
                                                            } catch { showToast("Upload failed", "error"); }
                                                        }} />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                                        className="px-3 py-2 bg-red-500/30 backdrop-blur rounded-lg text-sm text-red-300 hover:bg-red-500/50 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-all">
                                                <ImagePlus className="w-8 h-8 text-gray-600" />
                                                <span className="text-sm text-gray-500">Click to upload cover image</span>
                                                <span className="text-xs text-gray-600">PNG, JPG up to 5MB</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const uploadData = new FormData();
                                                    uploadData.append('image', file);
                                                    try {
                                                        const res = await api.post('/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                        setFormData({ ...formData, imageUrl: res.data.data.url });
                                                    } catch { showToast("Upload failed", "error"); }
                                                }} />
                                            </label>
                                        )}
                                    </div>

                                    {/* Section: Schedule */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <CalendarClock className="w-3.5 h-3.5" /> Schedule
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Start Date <span className="text-red-400">*</span></label>
                                                <input
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">End Date <span className="text-red-400">*</span></label>
                                                <input
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                    required
                                                    min={formData.startDate}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Reg. Deadline <span className="text-red-400">*</span></label>
                                                <input
                                                    type="date"
                                                    value={formData.registrationDeadline}
                                                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                                    required
                                                    max={formData.startDate}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                        {formData.startDate && !editingEvent && (
                                            <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                                <Info className="w-3 h-3" /> End date and deadline were auto-filled. Adjust if needed.
                                            </p>
                                        )}
                                    </div>

                                    {/* Section: Location & Venue */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <MapPin className="w-3.5 h-3.5" /> Location & Venue
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Host Dojo</label>
                                                <select
                                                    value={formData.dojoId}
                                                    onChange={(e) => handleDojoChange(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" className="bg-zinc-900">Select a dojo...</option>
                                                    {dojos.map(d => (
                                                        <option key={d.id} value={d.id} className="bg-zinc-900">{d.name}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[11px] text-gray-600 mt-1">Selecting a dojo auto-fills location</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Location <span className="text-red-400">*</span></label>
                                                <input
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    required
                                                    placeholder="City, State"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Capacity & Pricing */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <IndianRupee className="w-3.5 h-3.5" /> Capacity & Pricing
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Max Participants</label>
                                                <input
                                                    type="number"
                                                    value={formData.maxParticipants}
                                                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                                    min={1}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Member Fee (₹)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={formData.memberFee}
                                                        onChange={(e) => setFormData({ ...formData, memberFee: Number(e.target.value) })}
                                                        min={0}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1.5 block">Non-Member (₹)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={formData.nonMemberFee}
                                                        onChange={(e) => setFormData({ ...formData, nonMemberFee: Number(e.target.value) })}
                                                        min={0}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Status */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <Tag className="w-3.5 h-3.5" /> Event Status
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[
                                                { value: 'DRAFT', label: 'Draft', color: 'gray' },
                                                { value: 'UPCOMING', label: 'Upcoming', color: 'emerald' },
                                                { value: 'ONGOING', label: 'Ongoing', color: 'blue' },
                                                { value: 'COMPLETED', label: 'Completed', color: 'purple' },
                                                { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
                                            ].map(s => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: s.value })}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                                                        formData.status === s.value
                                                            ? s.color === 'gray' ? 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                                                            : s.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                                            : s.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                                            : s.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                                                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                                                            : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300'
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section: Categories (mainly for tournaments) */}
                                    {formData.type === 'TOURNAMENT' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <ListChecks className="w-3.5 h-3.5" /> Competition Categories
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, categories: [...formData.categories, { name: '', age: '', weight: '' }] })}
                                                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Category
                                                </button>
                                            </div>
                                            {formData.categories.length === 0 && (
                                                <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                                                    <p className="text-xs text-gray-500">No categories yet. Add competition categories for age/weight divisions.</p>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                {formData.categories.map((cat, idx) => (
                                                    <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                                                        <div>
                                                            {idx === 0 && <label className="text-[11px] text-gray-500 mb-1 block">Category Name</label>}
                                                            <input
                                                                value={cat.name}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.categories];
                                                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                                                    setFormData({ ...formData, categories: updated });
                                                                }}
                                                                placeholder="e.g. Men's Lightweight"
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            {idx === 0 && <label className="text-[11px] text-gray-500 mb-1 block">Age Range</label>}
                                                            <input
                                                                value={cat.age}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.categories];
                                                                    updated[idx] = { ...updated[idx], age: e.target.value };
                                                                    setFormData({ ...formData, categories: updated });
                                                                }}
                                                                placeholder="e.g. 18-35"
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            {idx === 0 && <label className="text-[11px] text-gray-500 mb-1 block">Weight Class</label>}
                                                            <input
                                                                value={cat.weight}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.categories];
                                                                    updated[idx] = { ...updated[idx], weight: e.target.value };
                                                                    setFormData({ ...formData, categories: updated });
                                                                }}
                                                                placeholder="e.g. <70kg"
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = formData.categories.filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, categories: updated });
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {formData.categories.length > 0 && (
                                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                                    <Info className="w-3 h-3" /> Categories will be shown on the event detail page. Participants can select during registration.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Live Summary */}
                                    {formData.name && (
                                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeAccent[formData.type]?.badge || 'bg-gray-500/15 text-gray-400'}`}>
                                                    {formData.type}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    formData.status === 'DRAFT' ? 'bg-yellow-500/15 text-yellow-400' :
                                                    formData.status === 'ONGOING' ? 'bg-blue-500/15 text-blue-400' :
                                                    formData.status === 'COMPLETED' ? 'bg-gray-500/15 text-gray-400' :
                                                    formData.status === 'CANCELLED' ? 'bg-orange-500/15 text-orange-400' :
                                                    'bg-emerald-500/15 text-emerald-400'
                                                }`}>
                                                    {formData.status}
                                                </span>
                                                <span className="text-white font-semibold">{formData.name}</span>
                                                {formData.location && <span className="text-gray-500">· {formData.location}</span>}
                                                {formData.startDate && (
                                                    <span className="text-gray-500">
                                                        · {new Date(formData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        {formData.endDate && formData.endDate !== formData.startDate && ` – ${new Date(formData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                                    </span>
                                                )}
                                                {formData.memberFee > 0 && <span className="text-gray-500">· ₹{formData.memberFee}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isSaving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
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
