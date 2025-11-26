"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock, User, Calendar, MapPin, Award, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

interface BeltVerificationRequest {
    id: string;
    studentId: string;
    requestedBelt: string;
    examDate: string;
    reason: string;
    status: string;
    createdAt: string;
    student: {
        id: string;
        name: string;
        email: string;
        phone: string;
        currentBeltRank: string;
        profilePhotoUrl: string | null;
        membershipNumber: string | null;
        city: string;
        state: string;
        dojo: {
            id: string;
            name: string;
            city: string;
        } | null;
        primaryInstructor: {
            id: string;
            name: string;
        } | null;
    };
}

export default function BeltApprovalsPage() {
    const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const [requests, setRequests] = useState<BeltVerificationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<BeltVerificationRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            checkAuth();
        }
    }, [isAuthenticated, checkAuth]);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
                router.push("/dashboard");
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    useEffect(() => {
        if (user) {
            fetchPendingRequests();
        }
    }, [user]);

    const fetchPendingRequests = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/belts/verifications/pending');
            setRequests(response.data.data.requests);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Failed to load requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'REJECT' && !rejectionReason.trim()) {
            setError("Please provide a reason for rejection");
            return;
        }

        try {
            setIsProcessing(true);
            setError("");
            await api.patch(`/belts/verifications/${requestId}`, {
                action,
                rejectionReason: action === 'REJECT' ? rejectionReason : undefined
            });

            // Refresh the list
            await fetchPendingRequests();
            setSelectedRequest(null);
            setRejectionReason("");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || `Failed to ${action.toLowerCase()} request`);
        } finally {
            setIsProcessing(false);
        }
    };

    const getBeltColor = (belt: string) => {
        const colors: Record<string, string> = {
            'White': 'bg-white text-black',
            'Orange': 'bg-orange-500 text-white',
            'Blue': 'bg-blue-500 text-white',
            'Yellow': 'bg-yellow-500 text-black',
            'Green': 'bg-green-500 text-white',
            'Brown': 'bg-amber-800 text-white',
            'Black': 'bg-black text-white border border-white/20'
        };
        return colors[belt] || 'bg-gray-500 text-white';
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />

            <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/management">
                        <Button variant="ghost" className="mb-4 text-zinc-400 hover:text-white">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Management
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                        Belt Verification Requests
                    </h1>
                    <p className="text-zinc-400">Review and approve student belt claims</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-xl bg-gradient-to-br from-zinc-900/50 to-black border border-white/5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-yellow-500/10">
                                <Clock className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{requests.length}</p>
                                <p className="text-xs text-zinc-400">Pending Requests</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Requests List */}
                {requests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                        <p className="text-zinc-400">No pending belt verification requests</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request, index) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-6 rounded-xl bg-gradient-to-br from-zinc-900/50 to-black border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Student Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Profile Photo */}
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                            {request.student.profilePhotoUrl ? (
                                                <Image
                                                    src={request.student.profilePhotoUrl}
                                                    alt={request.student.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-zinc-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-1">{request.student.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                                                        {request.student.membershipNumber && (
                                                            <span className="px-2 py-0.5 rounded bg-zinc-800/50 font-mono text-xs">
                                                                {request.student.membershipNumber}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {request.student.city}, {request.student.state}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Belt Change */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500">Current:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBeltColor(request.student.currentBeltRank)}`}>
                                                        {request.student.currentBeltRank}
                                                    </span>
                                                </div>
                                                <Award className="w-4 h-4 text-zinc-600" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500">Claimed:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBeltColor(request.requestedBelt)}`}>
                                                        {request.requestedBelt}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Exam Date */}
                                            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                                                <Calendar className="w-4 h-4" />
                                                <span>Exam Date: {new Date(request.examDate).toLocaleDateString()}</span>
                                            </div>

                                            {/* Reason */}
                                            {request.reason && (
                                                <div className="p-3 rounded-lg bg-zinc-800/30 border border-white/5">
                                                    <p className="text-sm text-zinc-300">&ldquo;{request.reason}&rdquo;</p>
                                                </div>
                                            )}

                                            {/* Dojo Info */}
                                            {request.student.dojo && (
                                                <div className="mt-3 text-xs text-zinc-500">
                                                    Dojo: {request.student.dojo.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex lg:flex-col gap-2 lg:w-40">
                                        <Button
                                            onClick={() => handleReview(request.id, 'APPROVE')}
                                            disabled={isProcessing}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => setSelectedRequest(request)}
                                            disabled={isProcessing}
                                            variant="outline"
                                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                            onClick={() => setSelectedRequest(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-zinc-900 rounded-xl border border-white/10 p-6 max-w-md w-full">
                                <h3 className="text-xl font-bold mb-4">Reject Belt Claim</h3>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Please provide a reason for rejecting {selectedRequest.student.name}&apos;s claim for {selectedRequest.requestedBelt} belt.
                                </p>
                                <Input
                                    placeholder="E.g., Insufficient documentation, need to verify with previous dojo"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="mb-4 bg-zinc-800 border-white/10"
                                />
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => {
                                            setSelectedRequest(null);
                                            setRejectionReason("");
                                        }}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleReview(selectedRequest.id, 'REJECT')}
                                        disabled={isProcessing || !rejectionReason.trim()}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Confirm Rejection'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
