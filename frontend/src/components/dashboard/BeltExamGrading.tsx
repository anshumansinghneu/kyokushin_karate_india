"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, XCircle, Clock, ChevronDown, Search, Users, Loader2, AlertTriangle, Download } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthStore } from "@/store/authStore";
import { downloadBeltCertificate, downloadAllBeltCertificates } from "@/lib/beltCertificateGenerator";

interface BeltExamEvent {
    id: string;
    name: string;
    startDate: string;
    status: string;
    location?: string;
    isPreEvent?: boolean;
    assignedInstructorId?: string;
    assignedInstructor?: { id: string; name: string };
}

interface Participant {
    registrationId: string;
    student: {
        id: string;
        name: string;
        email: string;
        currentBeltRank: string;
        membershipNumber: string | null;
        profilePhotoUrl: string | null;
        dojo: { name: string; city: string } | null;
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

const BELT_COLORS: Record<string, string> = {
    White: "bg-white text-black",
    Orange: "bg-orange-500 text-white",
    Blue: "bg-blue-500 text-white",
    Yellow: "bg-yellow-400 text-black",
    Green: "bg-green-500 text-white",
    Brown: "bg-amber-800 text-white",
    "Black 1st Dan": "bg-black text-white border border-white/30",
    "Black 2nd Dan": "bg-black text-white border border-white/30",
    "Black 3rd Dan": "bg-black text-white border border-white/30",
    "Black 4th Dan": "bg-black text-white border border-white/30",
};

export default function BeltExamGrading() {
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const [beltExamEvents, setBeltExamEvents] = useState<BeltExamEvent[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    const [gradingStudentId, setGradingStudentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PASS" | "FAIL">("ALL");

    useEffect(() => {
        fetchBeltExamEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchBeltExamEvents = async () => {
        setIsLoadingEvents(true);
        try {
            const res = await api.get("/events?limit=100");
            const events: BeltExamEvent[] = (res.data.data.events || []).filter(
                (e: BeltExamEvent & { type: string }) => e.type === "BELT_EXAM"
            );
            // For instructors, only show events assigned to them
            const filtered =
                user?.role === "INSTRUCTOR"
                    ? events.filter((e) => e.assignedInstructorId === user.id)
                    : events;
            setBeltExamEvents(filtered);
            if (filtered.length === 1) {
                setSelectedEventId(filtered[0].id);
            }
        } catch {
            showToast("Failed to fetch belt exam events", "error");
        } finally {
            setIsLoadingEvents(false);
        }
    };

    useEffect(() => {
        if (selectedEventId) {
            fetchParticipants(selectedEventId);
        } else {
            setParticipants([]);
            setSummary(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEventId]);

    const fetchParticipants = async (eventId: string) => {
        setIsLoadingParticipants(true);
        try {
            const res = await api.get(`/belt-exams/${eventId}/participants`);
            setParticipants(res.data.data.participants || []);
            setSummary(res.data.data.summary || null);
        } catch {
            showToast("Failed to fetch participants", "error");
            setParticipants([]);
            setSummary(null);
        } finally {
            setIsLoadingParticipants(false);
        }
    };

    const handleGrade = async (studentId: string, result: "PASS" | "FAIL", notes?: string) => {
        setGradingStudentId(studentId);
        try {
            const res = await api.post(`/belt-exams/${selectedEventId}/grade/${studentId}`, { result, notes });
            showToast(res.data.message || `Student ${result === "PASS" ? "promoted" : "failed"}`, result === "PASS" ? "success" : "info");
            fetchParticipants(selectedEventId);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Failed to grade student";
            showToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || errorMsg, "error");
        } finally {
            setGradingStudentId(null);
        }
    };

    const filteredParticipants = participants.filter((p) => {
        if (filterStatus !== "ALL" && p.result !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                p.student.name.toLowerCase().includes(q) ||
                (p.student.membershipNumber || "").toLowerCase().includes(q) ||
                p.currentBelt.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const selectedEvent = beltExamEvents.find((e) => e.id === selectedEventId);

    const passedParticipants = participants.filter((p) => p.result === "PASS");

    const handleDownloadCertificate = async (p: Participant) => {
        const instructorName = selectedEvent?.assignedInstructor?.name || user?.name || 'Instructor';
        await downloadBeltCertificate({
            studentName: p.student.name,
            instructorName,
            beltRank: p.targetBelt || p.currentBelt,
            dateOfApproval: p.gradedAt || new Date().toISOString(),
        });
    };

    const handleDownloadAllCertificates = async () => {
        const instructorName = selectedEvent?.assignedInstructor?.name || user?.name || 'Instructor';
        const certs = passedParticipants.map((p) => ({
            studentName: p.student.name,
            instructorName,
            beltRank: p.targetBelt || p.currentBelt,
            dateOfApproval: p.gradedAt || new Date().toISOString(),
        }));
        await downloadAllBeltCertificates(certs);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    Belt Exam Grading
                </h1>
                <p className="text-sm text-gray-500 mt-1.5 ml-[52px]">Grade students and promote belts</p>
            </div>

            {/* Event Selector */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Select Belt Exam Event</label>
                {isLoadingEvents ? (
                    <div className="flex items-center gap-2 text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading events...
                    </div>
                ) : beltExamEvents.length === 0 ? (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                            {user?.role === "INSTRUCTOR"
                                ? "No belt exam events assigned to you yet."
                                : "No belt exam events found. Create one from Event Management."}
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-zinc-900">Choose an event...</option>
                            {beltExamEvents.map((evt) => (
                                <option key={evt.id} value={evt.id} className="bg-zinc-900">
                                    {evt.name} — {new Date(evt.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    {evt.isPreEvent ? " (Pre-Event)" : ""}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Download All Certificates */}
            {passedParticipants.length > 0 && selectedEvent && (
                <div className="flex justify-end">
                    <button
                        onClick={handleDownloadAllCertificates}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download All Certificates ({passedParticipants.length})
                    </button>
                </div>
            )}

            {/* Summary Stats */}
            {summary && selectedEvent && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                        <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-white">{summary.total}</p>
                        <p className="text-[11px] text-gray-500 uppercase font-bold">Total</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-emerald-400">{summary.passed}</p>
                        <p className="text-[11px] text-gray-500 uppercase font-bold">Passed</p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                        <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-red-400">{summary.failed}</p>
                        <p className="text-[11px] text-gray-500 uppercase font-bold">Failed</p>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                        <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-amber-400">{summary.pending}</p>
                        <p className="text-[11px] text-gray-500 uppercase font-bold">Pending</p>
                    </div>
                </div>
            )}

            {/* Participants */}
            {selectedEventId && !isLoadingParticipants && participants.length > 0 && (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, membership or belt..."
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/30 transition-all"
                            />
                        </div>
                        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl flex-shrink-0">
                            {(["ALL", "PENDING", "PASS", "FAIL"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        filterStatus === s
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-300"
                                    }`}
                                >
                                    {s === "ALL" ? "All" : s === "PASS" ? "Passed" : s === "FAIL" ? "Failed" : "Pending"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Participant Cards */}
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredParticipants.map((p) => (
                                <motion.div
                                    key={p.student.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-all"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Student Info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {p.student.profilePhotoUrl ? (
                                                <img
                                                    src={p.student.profilePhotoUrl}
                                                    alt={p.student.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 text-sm font-bold">
                                                    {p.student.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{p.student.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {p.student.membershipNumber && (
                                                        <span className="text-[11px] text-gray-500">{p.student.membershipNumber}</span>
                                                    )}
                                                    {p.student.dojo && (
                                                        <span className="text-[11px] text-gray-600">{p.student.dojo.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Belt Info */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${BELT_COLORS[p.currentBelt] || "bg-gray-500 text-white"}`}>
                                                {p.currentBelt}
                                            </span>
                                            {p.targetBelt && (
                                                <>
                                                    <span className="text-gray-500 text-xs">→</span>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${BELT_COLORS[p.targetBelt] || "bg-gray-500 text-white"}`}>
                                                        {p.targetBelt}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Grading Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {p.result === "PENDING" ? (
                                                <>
                                                    <button
                                                        onClick={() => handleGrade(p.student.id, "PASS")}
                                                        disabled={gradingStudentId === p.student.id}
                                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {gradingStudentId === p.student.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                        )}
                                                        Promote
                                                    </button>
                                                    <button
                                                        onClick={() => handleGrade(p.student.id, "FAIL")}
                                                        disabled={gradingStudentId === p.student.id}
                                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Fail
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg ${
                                                        p.result === "PASS"
                                                            ? "text-emerald-400 bg-emerald-500/10"
                                                            : "text-red-400 bg-red-500/10"
                                                    }`}>
                                                        {p.result === "PASS" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        {p.result === "PASS" ? "Promoted" : "Failed"}
                                                    </span>
                                                    {p.result === "PASS" && (
                                                        <button
                                                            onClick={() => handleDownloadCertificate(p)}
                                                            title="Download Certificate"
                                                            className="flex items-center gap-1 px-2 py-2 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredParticipants.length === 0 && (
                            <div className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl">
                                <p className="text-gray-500 text-sm">No participants match your filter.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {selectedEventId && isLoadingParticipants && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
            )}

            {selectedEventId && !isLoadingParticipants && participants.length === 0 && (
                <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-xl">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No participants registered</p>
                    <p className="text-gray-600 text-sm mt-1">Students need to register for this belt exam first.</p>
                </div>
            )}
        </div>
    );
}
