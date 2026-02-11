"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Medal, ChevronRight, Calendar, CheckCircle, User, AlertCircle, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";
import StudentDetailView from "./StudentDetailView";

interface Student {
    id: string;
    name: string;
    email: string;
    membershipNumber: string;
    profilePhotoUrl: string | null;
    currentBeltRank: string;
    lastPromotionDate: string;
    daysSincePromotion: number;
    isEligible: boolean;
    nextEligibleDate: string | null;
    dojo: {
        name: string;
    };
}

const BELT_PROGRESSION = [
    { name: "White", color: "bg-gray-200 text-gray-800", value: 0 },
    { name: "Orange", color: "bg-orange-500 text-white", value: 1 },
    { name: "Blue", color: "bg-blue-500 text-white", value: 2 },
    { name: "Yellow", color: "bg-yellow-400 text-yellow-900", value: 3 },
    { name: "Green", color: "bg-green-600 text-white", value: 4 },
    { name: "Brown", color: "bg-amber-700 text-white", value: 5 },
    { name: "Black", color: "bg-black text-white border border-yellow-400", value: 6 },
];

export default function BeltPromotionsView() {
    const { showToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterEligible, setFilterEligible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [promotionDate, setPromotionDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");
    const [isPromoting, setIsPromoting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    useEffect(() => {
        fetchEligibleStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchEligibleStudents = async () => {
        try {
            const res = await api.get("/belts/eligible");
            setStudents(res.data.data.students);
        } catch (error) {
            console.error("Failed to fetch students:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to load students", "error");
        } finally {
            setLoading(false);
        }
    };

    const getNextBelt = (currentBelt: string): string | null => {
        const currentIndex = BELT_PROGRESSION.findIndex(b => b.name === currentBelt);
        if (currentIndex === -1 || currentIndex >= BELT_PROGRESSION.length - 1) return null;
        return BELT_PROGRESSION[currentIndex + 1].name;
    };

    const getBeltColor = (belt: string) => {
        const beltData = BELT_PROGRESSION.find(b => b.name === belt);
        return beltData?.color || "bg-gray-500 text-white";
    };

    const handlePromote = async () => {
        if (!selectedStudent) return;

        const nextBelt = getNextBelt(selectedStudent.currentBeltRank);
        if (!nextBelt) {
            showToast("Cannot promote further", "error");
            return;
        }

        setIsPromoting(true);
        try {
            await api.post("/belts/promote", {
                studentId: selectedStudent.id,
                newBelt: nextBelt,
                promotionDate,
                notes,
            });

            showToast(`${selectedStudent.name} promoted to ${nextBelt}!`, "success");
            setShowModal(false);
            setSelectedStudent(null);
            setNotes("");
            setPromotionDate(new Date().toISOString().split('T')[0]);
            fetchEligibleStudents();
        } catch (error) {
            console.error("Failed to promote student:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to promote student", "error");
        } finally {
            setIsPromoting(false);
        }
    };

    const handleBulkPromote = async () => {
        if (selectedStudents.size === 0) {
            showToast("Please select students to promote", "error");
            return;
        }

        setIsPromoting(true);
        let successCount = 0;
        let failCount = 0;

        for (const studentId of selectedStudents) {
            const student = students.find(s => s.id === studentId);
            if (!student) continue;

            const nextBelt = getNextBelt(student.currentBeltRank);
            if (!nextBelt) {
                failCount++;
                continue;
            }

            try {
                await api.post("/belts/promote", {
                    studentId: student.id,
                    newBelt: nextBelt,
                    promotionDate,
                    notes: `Bulk promotion - ${notes}`,
                });
                successCount++;
            } catch {
                failCount++;
            }
        }

        showToast(
            `Promoted ${successCount} student(s). ${failCount > 0 ? `${failCount} failed.` : ''}`,
            failCount > 0 ? "info" : "success"
        );

        setSelectedStudents(new Set());
        setNotes("");
        setPromotionDate(new Date().toISOString().split('T')[0]);
        fetchEligibleStudents();
        setIsPromoting(false);
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.membershipNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = !filterEligible || student.isEligible;
        return matchesSearch && matchesFilter;
    });

    const toggleStudentSelection = (studentId: string) => {
        const newSelection = new Set(selectedStudents);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudents(newSelection);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Belt Promotions</h1>
                    <p className="text-gray-400">Promote students to their next belt rank.</p>
                </div>
                {selectedStudents.size > 0 && (
                    <Button
                        onClick={handleBulkPromote}
                        disabled={isPromoting}
                        className="bg-primary hover:bg-primary-dark text-white font-bold"
                    >
                        <Medal className="w-4 h-4 mr-2" />
                        Promote {selectedStudents.size} Selected
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or membership number..."
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500"
                    />
                </div>
                <Button
                    onClick={() => setFilterEligible(!filterEligible)}
                    variant="outline"
                    className={`border-white/10 ${filterEligible ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    {filterEligible ? 'Eligible Only' : 'All Students'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Students</p>
                    <p className="text-2xl font-black text-white">{students.length}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-gray-400 mb-1">Eligible for Promotion</p>
                    <p className="text-2xl font-black text-green-400">
                        {students.filter(s => s.isEligible).length}
                    </p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-gray-400 mb-1">Selected</p>
                    <p className="text-2xl font-black text-primary">{selectedStudents.size}</p>
                </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 text-center"
                >
                    <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Students Found</h3>
                    <p className="text-gray-400">Try adjusting your search or filters.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredStudents.map((student, index) => {
                        const nextBelt = getNextBelt(student.currentBeltRank);
                        const isSelected = selectedStudents.has(student.id);

                        return (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                                className={`glass-card p-6 hover:bg-white/10 transition-all group ${isSelected ? 'ring-2 ring-primary' : ''}`}
                            >
                                <div className="flex items-start gap-6">
                                    {/* Checkbox */}
                                    {student.isEligible && (
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleStudentSelection(student.id)}
                                            className="w-5 h-5 mt-6 rounded border-white/20 bg-white/5 checked:bg-primary"
                                        />
                                    )}

                                    {/* Student Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                                            {getImageUrl(student.profilePhotoUrl) ? (
                                                <img
                                                    src={getImageUrl(student.profilePhotoUrl)!}
                                                    alt={student.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                                    {student.name[0]}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white truncate">
                                                    {student.name}
                                                </h3>
                                                <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-white/5 rounded">
                                                    {student.membershipNumber}
                                                </span>
                                                {student.isEligible ? (
                                                    <span className="text-xs font-bold text-green-400 px-2 py-1 bg-green-500/10 rounded flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Eligible
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-orange-400 px-2 py-1 bg-orange-500/10 rounded flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Not Yet
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-400 mb-4">
                                                {student.dojo?.name || 'No Dojo'} • {student.daysSincePromotion} days since last promotion
                                                {!student.isEligible && student.nextEligibleDate && (
                                                    <> • Eligible: {new Date(student.nextEligibleDate).toLocaleDateString()}</>
                                                )}
                                            </p>

                                            {/* Belt Progression */}
                                            {nextBelt && (
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getBeltColor(student.currentBeltRank)}`}>
                                                        {student.currentBeltRank}
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getBeltColor(nextBelt)}`}>
                                                        {nextBelt}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setShowModal(true);
                                        }}
                                        disabled={!student.isEligible || !nextBelt}
                                        className={`${student.isEligible
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gray-700 cursor-not-allowed'
                                            } text-white font-bold flex-1`}
                                    >
                                        <Medal className="w-4 h-4 mr-2" />
                                        Promote
                                    </Button>
                                    <Button
                                        onClick={() => setSelectedStudentId(student.id)}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Promotion Modal */}
            {showModal && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Medal className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Promote Student</h3>
                            <p className="text-gray-400">{selectedStudent.name}</p>
                        </div>

                        {/* Belt Progression */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getBeltColor(selectedStudent.currentBeltRank)}`}>
                                {selectedStudent.currentBeltRank}
                            </span>
                            <ChevronRight className="w-6 h-6 text-gray-500" />
                            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getBeltColor(getNextBelt(selectedStudent.currentBeltRank)!)}`}>
                                {getNextBelt(selectedStudent.currentBeltRank)}
                            </span>
                        </div>

                        {/* Date Picker */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-2">
                                <Calendar className="w-4 h-4" />
                                Promotion Date
                            </label>
                            <input
                                type="date"
                                value={promotionDate}
                                onChange={(e) => setPromotionDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about this promotion..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedStudent(null);
                                    setNotes("");
                                    setPromotionDate(new Date().toISOString().split('T')[0]);
                                }}
                                variant="outline"
                                className="flex-1 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                disabled={isPromoting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePromote}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                                disabled={isPromoting}
                            >
                                {isPromoting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Promoting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Promotion
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Student Detail View Modal */}
            {selectedStudentId && (
                <StudentDetailView
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}
        </div>
    );
}
