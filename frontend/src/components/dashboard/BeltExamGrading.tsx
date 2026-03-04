"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Search, CheckCircle, XCircle, Clock, Users, ChevronRight,
    ArrowLeft, Loader2, AlertCircle, ChevronDown, ChevronUp, FileText
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

const BELT_COLORS: Record<string, string> = {
    White: "bg-white text-black",
    Orange: "bg-orange-500 text-white",
    Blue: "bg-blue-600 text-white",
    Yellow: "bg-yellow-400 text-black",
    Green: "bg-green-600 text-white",
    Brown: "bg-amber-800 text-white",
    "Black 1st Dan": "bg-black text-white border border-white/30",
    "Black 2nd Dan": "bg-black text-white border border-white/30",
    "Black 3rd Dan": "bg-black text-white border border-white/30",
    "Black 4th Dan": "bg-black text-white border border-white/30",
};

interface BeltExamEvent {
    id: string;
    name: string;
    startDate: string;
    status: string;
}

interface Participant {
    registrationId: string;
    student: {
        id: string;
        name: string;
        email: string;
        currentBeltRank: string;
        membershipNumber: string;
        profilePhotoUrl?: string;
        dojo?: { name: string; city: string };
    };
    currentBelt: string;
    targetBelt: string | null;
    result: "PENDING" | "PASS" | "FAIL";
    resultId: string | null;
    notes: string | null;
    gradedAt: string | null;
}

interface Summary {
    total: number;
    passed: number;
    failed: number;
    pending: number;
}

export default function BeltExamGrading() {
    const { showToast } = useToast();
    const [beltExams, setBeltExams] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<BeltExamEvent | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [summary, setSummary] = useState<Summary>({ total: 0, passed: 0, failed: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [resultFilter, setResultFilter] = useState<"ALL" | "PENDING" | "PASS" | "FAIL">("ALL");
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

    // Bulk grading
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [isBulkGrading, setIsBulkGrading] = useState(false);
    const [bulkAction, setBulkAction] = useState<"PASS" | "FAIL" | null>(null);

    // Fetch belt exam events
    useEffect(() => {
        const fetchBeltExams = async () => {
            setIsLoading(true);
            try {
                const res = await api.get("/events?type=BELT_EXAM");
                setBeltExams(res.data.data.events || []);
            } catch (error) {
                console.error("Failed to fetch belt exams", error);
                showToast("Failed to load belt exam events", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBeltExams();
    }, []);

    // Fetch participants for selected event
    const fetchParticipants = async (eventId: string) => {
        setIsLoadingParticipants(true);
        try {
            const res = await api.get(`/belt-exams/${eventId}/participants`);
            const data = res.data.data;
            setSelectedEvent(data.event);
            setParticipants(data.participants);
            setSummary(data.summary);
        } catch (error) {
            console.error("Failed to fetch participants", error);
            showToast("Failed to load exam participants", "error");
        } finally {
            setIsLoadingParticipants(false);
        }
    };

    // Grade a single student
    const handleGrade = async (studentId: string, result: "PASS" | "FAIL") => {
        if (!selectedEvent) return;
        setGradingId(studentId);
        try {
            const res = await api.post(`/belt-exams/${selectedEvent.id}/grade/${studentId}`, {
                result,
                notes: noteInputs[studentId] || undefined,
            });
            showToast(res.data.message, result === "PASS" ? "success" : "info");
            await fetchParticipants(selectedEvent.id);
            setExpandedId(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || "Grading failed", "error");
        } finally {
            setGradingId(null);
        }
    };

    // Bulk grade
    const handleBulkGrade = async () => {
        if (!selectedEvent || !bulkAction || selectedStudents.size === 0) return;
        setIsBulkGrading(true);
        try {
            const grades = Array.from(selectedStudents).map(studentId => ({
                studentId,
                result: bulkAction,
                notes: noteInputs[studentId] || undefined,
            }));
            const res = await api.post(`/belt-exams/${selectedEvent.id}/grade`, { grades });
            const data = res.data.data;
            showToast(
                `${data.results.length} graded successfully${data.errors.length > 0 ? `, ${data.errors.length} failed` : ""}`,
                data.errors.length > 0 ? "info" : "success"
            );
            setSelectedStudents(new Set());
            setBulkAction(null);
            await fetchParticipants(selectedEvent.id);
        } catch (error: any) {
            showToast(error.response?.data?.message || "Bulk grading failed", "error");
        } finally {
            setIsBulkGrading(false);
        }
    };

    const filteredParticipants = participants.filter(p => {
        if (resultFilter !== "ALL" && p.result !== resultFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                p.student.name.toLowerCase().includes(q) ||
                p.student.email.toLowerCase().includes(q) ||
                (p.student.membershipNumber || "").toLowerCase().includes(q)
            );
        }
        return true;
    });

    const toggleSelect = (id: string) => {
        setSelectedStudents(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const pendingIds = filteredParticipants.filter(p => p.result === "PENDING").map(p => p.student.id);
        if (pendingIds.every(id => selectedStudents.has(id))) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(pendingIds));
        }
    };

    // ─── Event List View ────────────────────────────────────────────
    if (!selectedEvent && !isLoadingParticipants) {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            );
        }

        if (beltExams.length === 0) {
            return (
                <div className="glass-card p-12 text-center">
                    <Shield className="w-16 h-16 text-amber-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Belt Exams Found</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Create a Belt Exam event from the Event Manager to start grading students.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-amber-500" /> Belt Exam Grading
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Select an exam to grade participants</p>
                </div>

                <div className="grid gap-4">
                    {beltExams.map((exam, i) => {
                        const date = new Date(exam.startDate);
                        const isPast = date < new Date();
                        return (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <button
                                    onClick={() => fetchParticipants(exam.id)}
                                    className="w-full glass-card p-5 hover:bg-white/10 transition-all group text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                                <Shield className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                                                    {exam.name}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    {date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                                    {exam.location && ` • ${exam.location}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                                                isPast
                                                    ? "bg-gray-500/15 text-gray-400"
                                                    : "bg-emerald-500/15 text-emerald-400"
                                            }`}>
                                                {isPast ? "Completed" : "Active"}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-amber-400 transition-colors" />
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ─── Grading View ────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setSelectedEvent(null); setParticipants([]); setSearchQuery(""); setResultFilter("ALL"); setSelectedStudents(new Set()); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <Shield className="w-6 h-6 text-amber-500" /> {selectedEvent?.name || "Belt Exam"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {selectedEvent && new Date(selectedEvent.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                </div>
            </div>

            {isLoadingParticipants ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Total", value: summary.total, icon: Users, color: "text-white", bg: "bg-white/10" },
                            { label: "Passed", value: summary.passed, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
                            { label: "Failed", value: summary.failed, icon: XCircle, color: "text-red-400", bg: "bg-red-500/15" },
                            { label: "Pending", value: summary.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/15" },
                        ].map(stat => (
                            <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stat.value}</p>
                                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or membership..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                            {(["ALL", "PENDING", "PASS", "FAIL"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setResultFilter(f)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                        resultFilter === f
                                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                                    }`}
                                >
                                    {f === "ALL" ? "All" : f === "PASS" ? "Passed" : f === "FAIL" ? "Failed" : "Pending"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedStudents.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-amber-500/30"
                        >
                            <p className="text-sm text-white font-medium">
                                {selectedStudents.size} student{selectedStudents.size !== 1 ? "s" : ""} selected
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setBulkAction("PASS"); handleBulkGrade(); }}
                                    disabled={isBulkGrading}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isBulkGrading && bulkAction === "PASS" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Pass All
                                </button>
                                <button
                                    onClick={() => { setBulkAction("FAIL"); handleBulkGrade(); }}
                                    disabled={isBulkGrading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isBulkGrading && bulkAction === "FAIL" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Fail All
                                </button>
                                <button
                                    onClick={() => setSelectedStudents(new Set())}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Participant Cards */}
                    {filteredParticipants.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-white mb-1">No Participants</h3>
                            <p className="text-gray-400 text-sm">
                                {participants.length === 0
                                    ? "No students have registered for this exam yet."
                                    : "No participants match your filters."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All (only pending) */}
                            {filteredParticipants.some(p => p.result === "PENDING") && (
                                <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors px-1">
                                    <input
                                        type="checkbox"
                                        checked={filteredParticipants.filter(p => p.result === "PENDING").every(p => selectedStudents.has(p.student.id))}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30"
                                    />
                                    Select all pending ({filteredParticipants.filter(p => p.result === "PENDING").length})
                                </label>
                            )}

                            <AnimatePresence>
                                {filteredParticipants.map((p, i) => {
                                    const isExpanded = expandedId === p.student.id;
                                    const isGrading = gradingId === p.student.id;
                                    const resultStyle = {
                                        PASS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                                        FAIL: "bg-red-500/15 text-red-400 border-red-500/30",
                                        PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                                    }[p.result];

                                    return (
                                        <motion.div
                                            key={p.student.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="glass-card overflow-hidden"
                                        >
                                            <div className="p-4 flex items-center gap-4">
                                                {/* Checkbox */}
                                                {p.result === "PENDING" && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.has(p.student.id)}
                                                        onChange={() => toggleSelect(p.student.id)}
                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30 flex-shrink-0"
                                                    />
                                                )}

                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                                                    {p.student.profilePhotoUrl ? (
                                                        <img src={p.student.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        p.student.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>

                                                {/* Student Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm font-bold text-white truncate">{p.student.name}</h4>
                                                        {p.student.membershipNumber && (
                                                            <span className="text-xs text-gray-500">#{p.student.membershipNumber}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {p.student.dojo && (
                                                            <span className="text-xs text-gray-500">{p.student.dojo.name}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Belt Progression */}
                                                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BELT_COLORS[p.currentBelt] || "bg-gray-500 text-white"}`}>
                                                        {p.currentBelt}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.targetBelt ? (BELT_COLORS[p.targetBelt] || "bg-gray-500 text-white") : "bg-gray-700 text-gray-400"}`}>
                                                        {p.targetBelt || "Max"}
                                                    </span>
                                                </div>

                                                {/* Result Badge */}
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex-shrink-0 ${resultStyle}`}>
                                                    {p.result}
                                                </span>

                                                {/* Expand/Actions */}
                                                {p.result === "PENDING" ? (
                                                    <button
                                                        onClick={() => setExpandedId(isExpanded ? null : p.student.id)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                ) : (
                                                    <div className="w-8 flex-shrink-0" /> // spacer
                                                )}
                                            </div>

                                            {/* Mobile Belt Display */}
                                            <div className="sm:hidden px-4 pb-2 flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BELT_COLORS[p.currentBelt] || "bg-gray-500 text-white"}`}>
                                                    {p.currentBelt}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-gray-600" />
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.targetBelt ? (BELT_COLORS[p.targetBelt] || "bg-gray-500 text-white") : "bg-gray-700 text-gray-400"}`}>
                                                    {p.targetBelt || "Max"}
                                                </span>
                                            </div>

                                            {/* Expanded Grading Panel */}
                                            <AnimatePresence>
                                                {isExpanded && p.result === "PENDING" && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
                                                            {/* Notes */}
                                                            <div>
                                                                <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1.5">
                                                                    <FileText className="w-3 h-3" /> Notes (optional)
                                                                </label>
                                                                <textarea
                                                                    value={noteInputs[p.student.id] || ""}
                                                                    onChange={(e) => setNoteInputs(prev => ({ ...prev, [p.student.id]: e.target.value }))}
                                                                    placeholder="e.g. Excellent kata performance, needs improvement in kumite..."
                                                                    rows={2}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none"
                                                                />
                                                            </div>

                                                            {/* Grade Buttons */}
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => handleGrade(p.student.id, "PASS")}
                                                                    disabled={isGrading}
                                                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                                    Pass — Promote to {p.targetBelt}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleGrade(p.student.id, "FAIL")}
                                                                    disabled={isGrading}
                                                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                                    Fail
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Graded Info */}
                                            {p.result !== "PENDING" && p.gradedAt && (
                                                <div className="px-4 pb-3 text-xs text-gray-500 border-t border-white/5 pt-2">
                                                    Graded on {new Date(p.gradedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    {p.notes && <span className="ml-2">• {p.notes}</span>}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
