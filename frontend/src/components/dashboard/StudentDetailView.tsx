"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, User as UserIcon, Award, Calendar, Trophy, Clock, 
    MapPin, Mail, Phone, Shield, Download, Printer, 
    ChevronRight, TrendingUp, Activity, Medal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";

interface StudentDetailViewProps {
    studentId: string;
    onClose: () => void;
}

interface StudentProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    profilePhotoUrl: string | null;
    membershipNumber: string;
    currentBeltRank: string;
    membershipStatus: string;
    role: string;
    city: string;
    state: string;
    dateOfBirth: string;
    createdAt: string;
    dojo: {
        id: string;
        name: string;
        city: string;
        state: string;
    } | null;
    primaryInstructor: {
        id: string;
        name: string;
        currentBeltRank: string;
    } | null;
    beltHistory: Array<{
        id: string;
        oldBelt: string;
        newBelt: string;
        promotionDate: string;
        promotedBy: string;
        promotedByName: string;
        notes: string | null;
    }>;
    trainingSessions: Array<{
        id: string;
        date: string;
        duration: number;
        notes: string | null;
    }>;
    tournamentResults: Array<{
        id: string;
        tournamentName: string;
        category: string;
        placement: number;
        date: string;
    }>;
}

export default function StudentDetailView({ studentId, onClose }: StudentDetailViewProps) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'belt-history' | 'training' | 'tournaments' | 'timeline'>('overview');
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentDetails();
    }, [studentId]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/users/${studentId}/full-profile`);
            setStudent(res.data.data.user);
        } catch (error) {
            console.error("Failed to fetch student details:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to load student details", "error");
        } finally {
            setLoading(false);
        }
    };

    const getBeltColor = (belt: string) => {
        if (!belt) return "bg-gray-500";
        if (belt.includes("White")) return "bg-gray-200 text-gray-800";
        if (belt.includes("Yellow")) return "bg-yellow-400 text-yellow-900";
        if (belt.includes("Orange")) return "bg-orange-500 text-white";
        if (belt.includes("Blue")) return "bg-blue-500 text-white";
        if (belt.includes("Green")) return "bg-green-600 text-white";
        if (belt.includes("Brown")) return "bg-amber-700 text-white";
        if (belt.includes("Black") || belt.includes("Dan")) return "bg-black text-white border border-yellow-400";
        return "bg-gray-500 text-white";
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateDaysBetween = (date1: string, date2: string) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.abs(d2.getTime() - d1.getTime());
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        showToast("Export functionality coming soon!", "info");
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-black/90 border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-white">Student not found</p>
                    <Button onClick={onClose} className="mt-4">Close</Button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: UserIcon },
        { id: 'belt-history', label: 'Belt History', icon: Award },
        { id: 'training', label: 'Training', icon: Activity },
        { id: 'tournaments', label: 'Tournaments', icon: Trophy },
        { id: 'timeline', label: 'Timeline', icon: Clock },
    ];

    // Calculate training stats
    const totalSessions = student.trainingSessions.length;
    const totalHours = student.trainingSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgSessionsPerMonth = totalSessions / Math.max(1, calculateDaysBetween(student.createdAt, new Date().toISOString()) / 30);

    // Belt history stats
    const daysSinceLastPromotion = student.beltHistory.length > 0 
        ? calculateDaysBetween(student.beltHistory[0].promotionDate, new Date().toISOString())
        : calculateDaysBetween(student.createdAt, new Date().toISOString());
    const isEligibleForPromotion = daysSinceLastPromotion >= 180; // 6 months

    // Generate timeline events
    const timelineEvents = [
        {
            type: 'registration',
            date: student.createdAt,
            title: 'Account Created',
            description: `Joined as ${student.role}`,
            icon: UserIcon,
            color: 'bg-blue-500'
        },
        ...student.beltHistory.map(belt => ({
            type: 'promotion',
            date: belt.promotionDate,
            title: 'Belt Promotion',
            description: `${belt.oldBelt} → ${belt.newBelt}`,
            icon: Award,
            color: 'bg-yellow-500'
        })),
        ...student.tournamentResults.map(tournament => ({
            type: 'tournament',
            date: tournament.date,
            title: tournament.tournamentName,
            description: `Placed ${tournament.placement} in ${tournament.category}`,
            icon: Trophy,
            color: 'bg-purple-500'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black/95 border border-white/10 rounded-3xl w-full max-w-6xl my-8 overflow-hidden relative"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-b border-white/10 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {student.profilePhotoUrl ? (
                                <img
                                    src={getImageUrl(student.profilePhotoUrl)!}
                                    alt={student.name}
                                    className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                                    <UserIcon className="w-10 h-10 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-white">{student.name}</h2>
                                <p className="text-sm text-gray-400">{student.membershipNumber}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBeltColor(student.currentBeltRank)}`}>
                                        {student.currentBeltRank}
                                    </span>
                                    {isEligibleForPromotion && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                            Eligible for Promotion
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                size="sm"
                                className="bg-white/5 border-white/10 hover:bg-white/10"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button
                                onClick={handleExport}
                                variant="outline"
                                size="sm"
                                className="bg-white/5 border-white/10 hover:bg-white/10"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-red-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                            <Award className="w-4 h-4" />
                                            Belt Promotions
                                        </div>
                                        <p className="text-2xl font-bold text-white">{student.beltHistory.length}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                            <Activity className="w-4 h-4" />
                                            Training Sessions
                                        </div>
                                        <p className="text-2xl font-bold text-white">{totalSessions}</p>
                                        <p className="text-xs text-gray-500">{totalHours} hours total</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                            <Trophy className="w-4 h-4" />
                                            Tournaments
                                        </div>
                                        <p className="text-2xl font-bold text-white">{student.tournamentResults.length}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                            <Clock className="w-4 h-4" />
                                            Days Since Promotion
                                        </div>
                                        <p className="text-2xl font-bold text-white">{daysSinceLastPromotion}</p>
                                        <p className="text-xs text-gray-500">{isEligibleForPromotion ? 'Eligible now!' : `${180 - daysSinceLastPromotion} days to go`}</p>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <UserIcon className="w-5 h-5" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Email</p>
                                            <p className="text-white flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                {student.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Phone</p>
                                            <p className="text-white flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-500" />
                                                {student.phone}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Location</p>
                                            <p className="text-white flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                {student.city}, {student.state}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Date of Birth</p>
                                            <p className="text-white flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {student.dateOfBirth ? formatDate(student.dateOfBirth) : 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Member Since</p>
                                            <p className="text-white">{formatDate(student.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Status</p>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                                student.membershipStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                                student.membershipStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {student.membershipStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dojo & Instructor */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {student.dojo && (
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <MapPin className="w-5 h-5" />
                                                Dojo
                                            </h3>
                                            <p className="text-white font-medium">{student.dojo.name}</p>
                                            <p className="text-sm text-gray-400">{student.dojo.city}, {student.dojo.state}</p>
                                        </div>
                                    )}
                                    {student.primaryInstructor && (
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <Shield className="w-5 h-5" />
                                                Primary Instructor
                                            </h3>
                                            <p className="text-white font-medium">{student.primaryInstructor.name}</p>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block mt-2 ${getBeltColor(student.primaryInstructor.currentBeltRank)}`}>
                                                {student.primaryInstructor.currentBeltRank}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Belt History Tab */}
                        {activeTab === 'belt-history' && (
                            <motion.div
                                key="belt-history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 className="text-lg font-bold text-white mb-6">Promotion History</h3>
                                {student.beltHistory.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No belt promotions yet</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10"></div>
                                        
                                        {/* Timeline items */}
                                        <div className="space-y-6">
                                            {student.beltHistory.map((promotion, index) => {
                                                const nextPromotion = student.beltHistory[index + 1];
                                                const daysGap = nextPromotion 
                                                    ? calculateDaysBetween(nextPromotion.promotionDate, promotion.promotionDate)
                                                    : calculateDaysBetween(student.createdAt, promotion.promotionDate);
                                                
                                                return (
                                                    <div key={promotion.id} className="relative pl-20">
                                                        {/* Timeline dot */}
                                                        <div className="absolute left-6 w-5 h-5 rounded-full bg-yellow-500 border-4 border-black"></div>
                                                        
                                                        {/* Content */}
                                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getBeltColor(promotion.oldBelt)}`}>
                                                                        {promotion.oldBelt}
                                                                    </span>
                                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getBeltColor(promotion.newBelt)}`}>
                                                                        {promotion.newBelt}
                                                                    </span>
                                                                </div>
                                                                <span className="text-sm text-gray-400">{formatDate(promotion.promotionDate)}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-400 mb-2">
                                                                Promoted by: <span className="text-white">{promotion.promotedByName}</span>
                                                            </p>
                                                            {promotion.notes && (
                                                                <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-3 mt-2">
                                                                    {promotion.notes}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                {daysGap} days since previous rank
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            
                                            {/* Starting point */}
                                            <div className="relative pl-20">
                                                <div className="absolute left-6 w-5 h-5 rounded-full bg-gray-500 border-4 border-black"></div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <p className="text-white font-medium">Started Training</p>
                                                    <p className="text-sm text-gray-400">{formatDate(student.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Training Tab */}
                        {activeTab === 'training' && (
                            <motion.div
                                key="training"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white">Training Sessions</h3>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">{totalSessions}</p>
                                        <p className="text-sm text-gray-400">Total Sessions</p>
                                    </div>
                                </div>
                                
                                {student.trainingSessions.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No training sessions recorded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {student.trainingSessions.map((session) => (
                                            <div key={session.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-medium">{formatDate(session.date)}</p>
                                                    {session.notes && (
                                                        <p className="text-sm text-gray-400 mt-1">{session.notes}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-bold">{session.duration} min</p>
                                                    <p className="text-xs text-gray-500">Duration</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Tournaments Tab */}
                        {activeTab === 'tournaments' && (
                            <motion.div
                                key="tournaments"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 className="text-lg font-bold text-white mb-6">Tournament History</h3>
                                {student.tournamentResults.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No tournament participations yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {student.tournamentResults.map((result) => (
                                            <div key={result.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-white font-bold text-lg">{result.tournamentName}</h4>
                                                        <p className="text-sm text-gray-400 mt-1">Category: {result.category}</p>
                                                        <p className="text-sm text-gray-500 mt-1">{formatDate(result.date)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                                            result.placement === 1 ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                                                            result.placement === 2 ? 'bg-gray-400/20 border-2 border-gray-400' :
                                                            result.placement === 3 ? 'bg-amber-700/20 border-2 border-amber-700' :
                                                            'bg-blue-500/20 border-2 border-blue-500'
                                                        }`}>
                                                            {result.placement === 1 && <Medal className="w-8 h-8 text-yellow-500" />}
                                                            {result.placement !== 1 && <span className="text-2xl font-bold text-white">{result.placement}</span>}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">Place</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Timeline Tab */}
                        {activeTab === 'timeline' && (
                            <motion.div
                                key="timeline"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 className="text-lg font-bold text-white mb-6">Activity Timeline</h3>
                                <div className="relative">
                                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10"></div>
                                    
                                    <div className="space-y-6">
                                        {timelineEvents.map((event, index) => {
                                            const Icon = event.icon;
                                            return (
                                                <div key={index} className="relative pl-20">
                                                    <div className={`absolute left-6 w-5 h-5 rounded-full ${event.color} border-4 border-black`}></div>
                                                    
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-4 h-4 text-gray-400" />
                                                                <h4 className="text-white font-medium">{event.title}</h4>
                                                            </div>
                                                            <span className="text-sm text-gray-400">{formatDate(event.date)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300">{event.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
