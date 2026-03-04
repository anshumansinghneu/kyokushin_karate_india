"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, Plus, Edit2, Trash2, X, Save, MapPin, Users, Calendar,
    ImagePlus, Loader2, Building2, Image as ImageIcon,
    CheckCircle, Clock, AlertCircle, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Seminar {
    id: string;
    name: string;
    type: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    status: string;
    imageUrl?: string;
    maxParticipants: number;
    memberFee: number;
    nonMemberFee: number;
    registrationDeadline: string;
    dojoId?: string;
    dojo?: { name: string; city: string };
    registrationCount?: number;
    gallery?: { id: string; imageUrl: string; caption: string }[];
}

interface Dojo {
    id: string;
    name: string;
    city: string;
}

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption: string;
}

const STATUS_OPTIONS = [
    { value: "UPCOMING", label: "Upcoming", icon: Clock, color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
    { value: "ONGOING", label: "Ongoing", icon: CheckCircle, color: "text-green-400 bg-green-500/15 border-green-500/30" },
    { value: "COMPLETED", label: "Completed", icon: CheckCircle, color: "text-gray-400 bg-gray-500/15 border-gray-500/30" },
    { value: "DRAFT", label: "Draft", icon: AlertCircle, color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
    { value: "CANCELLED", label: "Cancelled", icon: X, color: "text-red-400 bg-red-500/15 border-red-500/30" },
];

export default function SeminarManager() {
    const { showToast } = useToast();
    const [seminars, setSeminars] = useState<Seminar[]>([]);
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
    const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [isLoadingGallery, setIsLoadingGallery] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
        location: "",
        dojoId: "",
        registrationDeadline: "",
        maxParticipants: 50,
        memberFee: 0,
        nonMemberFee: 0,
        status: "UPCOMING",
    });

    useEffect(() => {
        fetchSeminars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSeminars = async () => {
        setIsLoading(true);
        try {
            const [eventsRes, dojosRes] = await Promise.all([
                api.get("/events"),
                api.get("/dojos"),
            ]);
            const allEvents = eventsRes.data.data.events || [];
            setSeminars(allEvents.filter((e: Seminar) => e.type === "SEMINAR"));
            setDojos(dojosRes.data.data.dojos || []);
        } catch (error) {
            console.error("Failed to fetch seminars", error);
            showToast("Failed to load seminars", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartDateChange = (startDate: string) => {
        const updates: Partial<typeof formData> = { startDate };
        if (startDate) {
            const d = new Date(startDate);
            if (!formData.endDate || new Date(formData.endDate) < d) {
                const end = new Date(d);
                end.setDate(end.getDate() + 1);
                updates.endDate = end.toISOString().split("T")[0];
            }
            if (!formData.registrationDeadline) {
                const deadline = new Date(d);
                deadline.setDate(deadline.getDate() - 7);
                updates.registrationDeadline = deadline.toISOString().split("T")[0];
            }
        }
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const handleDojoChange = (dojoId: string) => {
        setFormData((prev) => {
            const dojo = dojos.find((d) => d.id === dojoId);
            return { ...prev, dojoId, location: dojo ? `${dojo.name}, ${dojo.city}` : prev.location };
        });
    };

    const openCreateModal = () => {
        setEditingSeminar(null);
        setFormData({
            name: "",
            description: "",
            imageUrl: "",
            startDate: "",
            endDate: "",
            location: "",
            dojoId: "",
            registrationDeadline: "",
            maxParticipants: 50,
            memberFee: 0,
            nonMemberFee: 0,
            status: "UPCOMING",
        });
        setIsModalOpen(true);
    };

    const openEditModal = async (seminar: Seminar) => {
        setEditingSeminar(seminar);
        let description = seminar.description || "";
        try {
            const res = await api.get(`/events/${seminar.id}`);
            description = res.data.data.event?.description || description;
        } catch { /* fallback */ }
        setFormData({
            name: seminar.name,
            description,
            imageUrl: seminar.imageUrl || "",
            startDate: new Date(seminar.startDate).toISOString().split("T")[0],
            endDate: new Date(seminar.endDate).toISOString().split("T")[0],
            location: seminar.location || "",
            dojoId: seminar.dojoId || "",
            registrationDeadline: new Date(seminar.registrationDeadline).toISOString().split("T")[0],
            maxParticipants: seminar.maxParticipants || 50,
            memberFee: seminar.memberFee || 0,
            nonMemberFee: seminar.nonMemberFee || 0,
            status: seminar.status || "UPCOMING",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.startDate || !formData.endDate || !formData.registrationDeadline) {
            showToast("Please fill required fields", "error");
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                type: "SEMINAR",
                dojoId: formData.dojoId || null,
                imageUrl: formData.imageUrl || null,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
                maxParticipants: Number(formData.maxParticipants) || null,
                memberFee: Number(formData.memberFee) || 0,
                nonMemberFee: Number(formData.nonMemberFee) || 0,
            };

            if (editingSeminar) {
                await api.patch(`/events/${editingSeminar.id}`, payload);
                showToast("Seminar updated!", "success");
            } else {
                await api.post("/events", payload);
                showToast("Seminar created!", "success");
            }
            setIsModalOpen(false);
            fetchSeminars();
        } catch (error) {
            console.error("Failed to save seminar", error);
            showToast("Failed to save seminar", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/events/${deleteId}`);
            showToast("Seminar deleted", "success");
            setDeleteId(null);
            fetchSeminars();
        } catch (error) {
            console.error("Failed to delete seminar", error);
            showToast("Failed to delete seminar", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // Gallery management
    const openGallery = async (seminar: Seminar) => {
        setSelectedSeminar(seminar);
        setIsGalleryModalOpen(true);
        setIsLoadingGallery(true);
        try {
            const res = await api.get(`/gallery?eventId=${seminar.id}`);
            setGalleryImages(res.data.data.items || []);
        } catch (error) {
            console.error("Failed to fetch gallery", error);
            setGalleryImages([]);
        } finally {
            setIsLoadingGallery(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSeminar) return;

        setIsUploading(true);
        try {
            // Upload file
            const uploadForm = new FormData();
            uploadForm.append("image", file);
            uploadForm.append("folder", "seminars");
            const uploadRes = await api.post("/upload", uploadForm, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const imageUrl = uploadRes.data.data.url;

            // Save to gallery linked to this event
            await api.post("/gallery", {
                imageUrl,
                eventId: selectedSeminar.id,
                caption: selectedSeminar.name,
            });

            // Refresh gallery
            const res = await api.get(`/gallery?eventId=${selectedSeminar.id}`);
            setGalleryImages(res.data.data.items || []);
            showToast("Image uploaded!", "success");
        } catch (error) {
            console.error("Failed to upload", error);
            showToast("Failed to upload image", "error");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        try {
            await api.delete(`/gallery/${imageId}`);
            setGalleryImages((prev) => prev.filter((i) => i.id !== imageId));
            showToast("Image removed", "success");
        } catch (error) {
            console.error("Failed to delete image", error);
            showToast("Failed to delete image", "error");
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadForm = new FormData();
            uploadForm.append("image", file);
            uploadForm.append("folder", "events");
            const uploadRes = await api.post("/upload", uploadForm, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFormData((prev) => ({ ...prev, imageUrl: uploadRes.data.data.url }));
            showToast("Cover image uploaded!", "success");
        } catch (error) {
            console.error("Failed to upload cover", error);
            showToast("Failed to upload cover image", "error");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const getStatusConfig = (status: string) => {
        return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    };

    const filteredSeminars = statusFilter === "ALL"
        ? seminars
        : seminars.filter((s) => s.status === statusFilter);

    const upcomingSeminars = seminars.filter((s) => s.status === "UPCOMING" || s.status === "ONGOING");
    const pastSeminars = seminars.filter((s) => s.status === "COMPLETED");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        Seminar Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1.5 ml-[52px]">
                        {seminars.length} total · {upcomingSeminars.length} upcoming · {pastSeminars.length} completed
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-5 h-5" /> New Seminar
                </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
                {[{ value: "ALL", label: "All" }, ...STATUS_OPTIONS.slice(0, 3)].map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            statusFilter === opt.value
                                ? "bg-white/10 text-white border-white/20 shadow-sm"
                                : "bg-transparent text-gray-500 border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                        }`}
                    >
                        {opt.label}
                        {opt.value === "ALL" && ` (${seminars.length})`}
                        {opt.value !== "ALL" && ` (${seminars.filter((s) => s.status === opt.value).length})`}
                    </button>
                ))}
            </div>

            {/* Seminars List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : filteredSeminars.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-bold">No seminars found</p>
                    <p className="text-sm mt-1">Create your first seminar to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSeminars.map((seminar) => {
                        const statusCfg = getStatusConfig(seminar.status);
                        return (
                            <motion.div
                                key={seminar.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group border border-white/[0.06] bg-white/[0.01] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all"
                            >
                                {/* Cover Image */}
                                <div className="relative h-40 bg-gradient-to-br from-blue-900/30 to-black overflow-hidden">
                                    {seminar.imageUrl ? (
                                        <img src={seminar.imageUrl} alt={seminar.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-10 h-10 text-blue-500/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                                    {/* Status Badge */}
                                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                                        {statusCfg.label}
                                    </span>

                                    {/* Title overlay */}
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">{seminar.name}</h3>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                            {new Date(seminar.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                        {seminar.location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="truncate max-w-[150px]">{seminar.location}</span>
                                            </span>
                                        )}
                                    </div>

                                    {seminar.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2">{seminar.description}</p>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {seminar.dojo && (
                                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                                <Building2 className="w-3 h-3" /> {seminar.dojo.name}
                                            </span>
                                        )}
                                        {seminar.maxParticipants > 0 && (
                                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                                <Users className="w-3 h-3" /> Max {seminar.maxParticipants}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditModal(seminar)}
                                            className="text-gray-400 hover:text-white hover:bg-white/10 flex-1 h-9"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openGallery(seminar)}
                                            className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 flex-1 h-9"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Gallery
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeleteId(seminar.id)}
                                            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-9 px-3"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-2xl my-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold text-white">
                                    {editingSeminar ? "Edit Seminar" : "Create New Seminar"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seminar Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g., Self Defense Workshop for Corporate"
                                        className="input-glass h-11"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</Label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Describe the seminar, what participants will learn..."
                                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 min-h-[100px] resize-y text-sm"
                                        rows={4}
                                    />
                                </div>

                                {/* Cover Image */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cover Image</Label>
                                    <div className="flex items-center gap-3">
                                        {formData.imageUrl ? (
                                            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10">
                                                <img src={formData.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData((p) => ({ ...p, imageUrl: "" }))}
                                                    className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-blue-500/50 cursor-pointer transition-all text-sm">
                                                <Upload className="w-4 h-4" />
                                                {isUploading ? "Uploading..." : "Upload Cover"}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={isUploading} />
                                            </label>
                                        )}
                                        <span className="text-xs text-gray-600">or paste URL:</span>
                                        <Input
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                                            placeholder="https://..."
                                            className="input-glass h-9 flex-1 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData((p) => ({ ...p, status: opt.value }))}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                    formData.status === opt.value
                                                        ? opt.color
                                                        : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dates Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date *</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                            className="input-glass h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Date *</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                                            className="input-glass h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reg. Deadline *</Label>
                                        <Input
                                            type="date"
                                            value={formData.registrationDeadline}
                                            onChange={(e) => setFormData((p) => ({ ...p, registrationDeadline: e.target.value }))}
                                            className="input-glass h-11"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Location + Dojo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</Label>
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                                            placeholder="Venue name or address"
                                            className="input-glass h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Host Dojo</Label>
                                        <select
                                            value={formData.dojoId}
                                            onChange={(e) => handleDojoChange(e.target.value)}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 h-11 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm"
                                        >
                                            <option value="">No specific dojo</option>
                                            {dojos.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name} — {d.city}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Capacity + Pricing */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Participants</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxParticipants}
                                            onChange={(e) => setFormData((p) => ({ ...p, maxParticipants: Number(e.target.value) }))}
                                            className="input-glass h-11"
                                            min={0}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member Fee (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.memberFee}
                                            onChange={(e) => setFormData((p) => ({ ...p, memberFee: Number(e.target.value) }))}
                                            className="input-glass h-11"
                                            min={0}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Non-Member Fee (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.nonMemberFee}
                                            onChange={(e) => setFormData((p) => ({ ...p, nonMemberFee: Number(e.target.value) }))}
                                            className="input-glass h-11"
                                            min={0}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-11 px-8 flex-1 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editingSeminar ? "Update Seminar" : "Create Seminar"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gallery Modal */}
            <AnimatePresence>
                {isGalleryModalOpen && selectedSeminar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                        onClick={() => setIsGalleryModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-3xl my-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Gallery</h3>
                                    <p className="text-sm text-gray-400 mt-1">{selectedSeminar.name}</p>
                                </div>
                                <button onClick={() => setIsGalleryModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Upload Button */}
                                <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600/10 border border-dashed border-blue-500/30 text-blue-400 hover:bg-blue-600/20 cursor-pointer transition-all text-sm font-bold w-fit">
                                    {isUploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><ImagePlus className="w-4 h-4" /> Add Photos</>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                </label>

                                {/* Gallery Grid */}
                                {isLoadingGallery ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                    </div>
                                ) : galleryImages.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No photos yet. Upload some to showcase this seminar.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {galleryImages.map((img) => (
                                            <div key={img.id} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black">
                                                <img src={img.imageUrl} alt={img.caption || "Seminar photo"} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleDeleteImage(img.id)}
                                                        className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setDeleteId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Seminar?</h3>
                            <p className="text-gray-400 text-sm mb-6">This will permanently remove this seminar and cannot be undone.</p>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-gray-400">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
