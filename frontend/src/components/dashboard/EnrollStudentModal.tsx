"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Users, Calendar, CheckCircle, Ticket, Loader2, AlertCircle,
    Search, ChevronRight, ChevronLeft, MapPin, Trophy, Shield, Tent, GraduationCap
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface EnrollStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface Student {
    id: string;
    name: string;
    email: string;
    currentBeltRank: string;
    membershipStatus: string;
    phone?: string;
}

interface EventItem {
    id: string;
    name: string;
    type: "TOURNAMENT" | "CAMP" | "SEMINAR";
    startDate: string;
    endDate: string;
    location?: string;
    registrationDeadline: string;
    memberFee: number;
    status: string;
    maxParticipants?: number;
    _count?: { registrations: number };
    categories?: Array<{ age?: string; weight?: string; belt?: string }>;
}

const STEPS = [
    { id: 1, label: "Select Student", desc: "Choose from your roster" },
    { id: 2, label: "Select Event", desc: "Pick an upcoming event" },
    { id: 3, label: "Confirm & Pay", desc: "Review and enroll" },
];

const eventTypeIcon = {
    TOURNAMENT: Trophy,
    CAMP: Tent,
    SEMINAR: GraduationCap,
};

const eventTypeColor = {
    TOURNAMENT: "text-red-400 bg-red-500/10 border-red-500/20",
    CAMP: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    SEMINAR: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default function EnrollStudentModal({ isOpen, onClose, onSuccess }: EnrollStudentModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Data
    const [students, setStudents] = useState<Student[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Selections
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [eventType, setEventType] = useState("");       // Kata / Kumite / Both
    const [categoryAge, setCategoryAge] = useState("");
    const [categoryWeight, setCategoryWeight] = useState("");
    const [categoryBelt, setCategoryBelt] = useState("");

    // Voucher
    const [useVoucher, setUseVoucher] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState(false);
    const [voucherError, setVoucherError] = useState("");

    // Search / filter
    const [studentSearch, setStudentSearch] = useState("");
    const [eventFilter, setEventFilter] = useState<"ALL" | "TOURNAMENT" | "CAMP" | "SEMINAR">("ALL");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchStudents = useCallback(async () => {
        setLoadingStudents(true);
        try {
            const res = await api.get("/users?status=ACTIVE&limit=200");
            setStudents((res.data.data.users || []).filter((u: Student) => u.membershipStatus === "ACTIVE"));
        } catch {
            showToast("Failed to load students", "error");
        } finally {
            setLoadingStudents(false);
        }
    }, [showToast]);

    const fetchEvents = useCallback(async () => {
        setLoadingEvents(true);
        try {
            const res = await api.get("/events");
            const now = new Date();
            const available = (res.data.data.events || []).filter((e: EventItem) =>
                (e.status === "UPCOMING" || e.status === "ONGOING") &&
                new Date(e.registrationDeadline) > now
            );
            setEvents(available);
        } catch {
            showToast("Failed to load events", "error");
        } finally {
            setLoadingEvents(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
            fetchEvents();
        }
    }, [isOpen, fetchStudents, fetchEvents]);

    const handleValidateVoucher = async () => {
        if (!voucherCode.trim() || !selectedEvent) return;
        setVoucherValidating(true);
        setVoucherError("");
        setVoucherValid(false);
        try {
            await api.post("/vouchers/validate", {
                code: voucherCode.trim(),
                type: selectedEvent.type,
            });
            setVoucherValid(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setVoucherError(error.response?.data?.message || "Invalid voucher code");
        } finally {
            setVoucherValidating(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStudent || !selectedEvent) return;
        setIsSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                studentId: selectedStudent.id,
                eventType: eventType || undefined,
                categoryAge: categoryAge || undefined,
                categoryWeight: categoryWeight || undefined,
                categoryBelt: categoryBelt || undefined,
            };
            if (useVoucher && voucherValid) {
                payload.voucherCode = voucherCode.trim().toUpperCase();
            }
            const res = await api.post(`/events/${selectedEvent.id}/enroll-student`, payload);
            setSuccessMessage(res.data.message || `${selectedStudent.name} enrolled successfully!`);
            setSuccess(true);
            showToast(`${selectedStudent.name} enrolled in ${selectedEvent.name}!`, "success");
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showToast(error.response?.data?.message || "Enrollment failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedStudent(null);
        setSelectedEvent(null);
        setEventType("");
        setCategoryAge("");
        setCategoryWeight("");
        setCategoryBelt("");
        setUseVoucher(false);
        setVoucherCode("");
        setVoucherValid(false);
        setVoucherError("");
        setSuccess(false);
        setSuccessMessage("");
        onClose();
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const filteredEvents = events.filter(e =>
        eventFilter === "ALL" ? true : e.type === eventFilter
    );

    if (!isOpen) return null;

    const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all";
    const labelCls = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-700/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Enroll Student in Event</h2>
                                <p className="text-[11px] text-gray-400">Register your student for an upcoming event</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stepper */}
                    {!success && (
                        <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
                            <div className="flex items-center gap-0">
                                {STEPS.map((s, i) => (
                                    <div key={s.id} className="flex items-center flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all flex-shrink-0 ${
                                                step > s.id ? 'bg-green-600 border-green-600 text-white scale-90' :
                                                step === s.id ? 'border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20' :
                                                'border-gray-700 text-gray-600'
                                            }`}>
                                                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : s.id}
                                            </div>
                                            <div className="hidden sm:block min-w-0">
                                                <p className={`text-[11px] font-bold leading-none truncate ${step === s.id ? 'text-white' : step > s.id ? 'text-green-400' : 'text-gray-600'}`}>{s.label}</p>
                                                <p className="text-[9px] text-gray-600 mt-0.5 truncate">{s.desc}</p>
                                            </div>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`flex-1 h-[2px] mx-3 rounded-full transition-colors ${step > s.id ? 'bg-green-600' : 'bg-white/[0.06]'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <AnimatePresence mode="wait">

                            {/* SUCCESS */}
                            {success && (
                                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                        className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-5"
                                    >
                                        <CheckCircle className="w-10 h-10 text-green-500" />
                                    </motion.div>
                                    <h3 className="text-2xl font-black text-white mb-2">Enrollment Complete!</h3>
                                    <p className="text-gray-400 text-sm mb-6">{successMessage}</p>

                                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-left space-y-3 mb-6 max-w-sm mx-auto">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Student</span>
                                            <span className="text-white font-semibold">{selectedStudent?.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Event</span>
                                            <span className="text-white font-semibold truncate ml-4">{selectedEvent?.name}</span>
                                        </div>
                                        {useVoucher && voucherValid && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Payment</span>
                                                <span className="text-green-400 font-semibold">Paid via Voucher</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleClose}
                                        className="w-full max-w-sm py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        Done
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 1: Select Student */}
                            {!success && step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <p className="text-xs font-bold text-gray-400">Select a student from your roster</p>
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            placeholder="Search students by name or email..."
                                            className={`${inputCls} pl-10`}
                                        />
                                    </div>

                                    {loadingStudents ? (
                                        <div className="flex items-center justify-center py-10 text-gray-500">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading students...
                                        </div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 text-sm">
                                            {studentSearch ? "No matching students found" : "No active students found in your roster"}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                                            {filteredStudents.map((student) => (
                                                <button
                                                    key={student.id}
                                                    onClick={() => setSelectedStudent(student)}
                                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                                        selectedStudent?.id === student.id
                                                            ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                                                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                        selectedStudent?.id === student.id ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'
                                                    }`}>
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white truncate">{student.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 text-gray-400">
                                                            {student.currentBeltRank || "White"}
                                                        </span>
                                                        {selectedStudent?.id === student.id && (
                                                            <CheckCircle className="w-5 h-5 text-blue-400" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* STEP 2: Select Event */}
                            {!success && step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                        <p className="text-xs font-bold text-gray-400">Enrolling: <span className="text-white">{selectedStudent?.name}</span></p>
                                    </div>

                                    {/* Event type filter */}
                                    <div className="flex gap-2 flex-wrap">
                                        {(["ALL", "TOURNAMENT", "CAMP", "SEMINAR"] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setEventFilter(type)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    eventFilter === type
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                {type === "ALL" ? "All Events" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
                                            </button>
                                        ))}
                                    </div>

                                    {loadingEvents ? (
                                        <div className="flex items-center justify-center py-10 text-gray-500">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading events...
                                        </div>
                                    ) : filteredEvents.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 text-sm">
                                            No upcoming events available for registration
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                                            {filteredEvents.map((event) => {
                                                const Icon = eventTypeIcon[event.type] || Trophy;
                                                const colorCls = eventTypeColor[event.type] || eventTypeColor.TOURNAMENT;
                                                const deadline = new Date(event.registrationDeadline);
                                                const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                                                return (
                                                    <button
                                                        key={event.id}
                                                        onClick={() => setSelectedEvent(event)}
                                                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                                                            selectedEvent?.id === event.id
                                                                ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                                                                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-sm font-bold text-white truncate">{event.name}</p>
                                                                    {selectedEvent?.id === event.id && (
                                                                        <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {new Date(event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                    {event.location && (
                                                                        <span className="flex items-center gap-1">
                                                                            <MapPin className="w-3 h-3" />
                                                                            {event.location}
                                                                        </span>
                                                                    )}
                                                                    <span className={`font-bold ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-green-400'}`}>
                                                                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="text-sm font-black text-white">₹{event.memberFee}</p>
                                                                <p className={`text-[10px] font-bold px-1.5 py-0.5 mt-1 rounded ${colorCls}`}>
                                                                    {event.type}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* STEP 3: Confirm & Pay */}
                            {!success && step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    {/* Summary */}
                                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 space-y-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Enrollment Summary</p>
                                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                                            <span className="text-gray-400">Student</span>
                                            <span className="text-white font-semibold text-right">{selectedStudent?.name}</span>
                                            <span className="text-gray-400">Event</span>
                                            <span className="text-white font-semibold text-right truncate">{selectedEvent?.name}</span>
                                            <span className="text-gray-400">Type</span>
                                            <span className="text-white text-right">{selectedEvent?.type}</span>
                                            <span className="text-gray-400">Date</span>
                                            <span className="text-white text-right">{selectedEvent && new Date(selectedEvent.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            <span className="text-gray-400">Fee</span>
                                            <span className="text-white font-semibold text-right">₹{selectedEvent?.memberFee}</span>
                                        </div>
                                    </div>

                                    {/* Event Category Options (for tournaments) */}
                                    {selectedEvent?.type === 'TOURNAMENT' && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Event Options</p>
                                            <div>
                                                <label className={labelCls}>Participation Type</label>
                                                <select
                                                    value={eventType}
                                                    onChange={(e) => setEventType(e.target.value)}
                                                    className={`${inputCls} appearance-none cursor-pointer`}
                                                >
                                                    <option value="" className="bg-zinc-900">Select type...</option>
                                                    <option value="Kata" className="bg-zinc-900">Kata</option>
                                                    <option value="Kumite" className="bg-zinc-900">Kumite</option>
                                                    <option value="Both" className="bg-zinc-900">Both (Kata + Kumite)</option>
                                                </select>
                                            </div>

                                            {selectedEvent.categories && Array.isArray(selectedEvent.categories) && (selectedEvent.categories as Array<{ age?: string; weight?: string; belt?: string }>).length > 0 && (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className={labelCls}>Age Category</label>
                                                        <input value={categoryAge} onChange={(e) => setCategoryAge(e.target.value)} placeholder="e.g. 18-25" className={inputCls} />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Weight</label>
                                                        <input value={categoryWeight} onChange={(e) => setCategoryWeight(e.target.value)} placeholder="e.g. -70kg" className={inputCls} />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Belt</label>
                                                        <input value={categoryBelt} onChange={(e) => setCategoryBelt(e.target.value)} placeholder="e.g. Green" className={inputCls} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Voucher toggle */}
                                    {selectedEvent && selectedEvent.memberFee > 0 && (
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${useVoucher ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                                    {useVoucher && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className="text-sm text-gray-300 font-semibold">Pay with voucher</span>
                                            </label>

                                            {useVoucher && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                            <input
                                                                value={voucherCode}
                                                                onChange={(e) => {
                                                                    setVoucherCode(e.target.value.toUpperCase());
                                                                    setVoucherError("");
                                                                    setVoucherValid(false);
                                                                }}
                                                                placeholder="KKFI-XXXXXXXX"
                                                                className={`${inputCls} pl-10 font-mono tracking-wider`}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleValidateVoucher}
                                                            disabled={voucherValidating || !voucherCode.trim()}
                                                            className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex-shrink-0"
                                                        >
                                                            {voucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                                        </button>
                                                    </div>
                                                    {voucherError && (
                                                        <div className="flex items-center gap-2 text-red-400 text-sm">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {voucherError}
                                                        </div>
                                                    )}
                                                    {voucherValid && (
                                                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-bold text-green-400">Voucher Valid!</p>
                                                                <p className="text-xs text-gray-400">Event fee will be covered.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* Info: no voucher → pending payment */}
                                    {selectedEvent && selectedEvent.memberFee > 0 && !useVoucher && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                            <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                Without a voucher, the enrollment will be created with payment pending. Student can pay later.
                                            </p>
                                        </div>
                                    )}

                                    {selectedEvent?.type === 'TOURNAMENT' && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                            <p className="text-[11px] text-blue-400 flex items-center gap-1.5">
                                                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                                                Tournament registrations require admin approval before confirmation.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {!success && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02] flex-shrink-0">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                            ) : (
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            )}

                            <div className="flex items-center gap-3">
                                {step < 3 && <span className="text-[11px] text-gray-600">Step {step} of 3</span>}

                                {step === 1 && (
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!selectedStudent}
                                        className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-700 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-40 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}

                                {step === 2 && (
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedEvent}
                                        className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-700 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-40 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}

                                {step === 3 && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || (useVoucher && !voucherValid)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-700 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-40 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        {isSubmitting ? "Enrolling..." : "Enroll Student"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
