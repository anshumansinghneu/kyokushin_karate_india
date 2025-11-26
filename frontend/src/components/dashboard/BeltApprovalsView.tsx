"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Medal, CheckCircle, XCircle, Clock, Calendar, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";

interface BeltVerificationRequest {
    id: string;
    currentBelt: string;
    requestedBelt: string;
    examDate: string;
    reason: string;
    status: string;
    createdAt: string;
    student: {
        id: string;
        name: string;
        email: string;
        profilePhotoUrl: string | null;
        membershipId: string;
    };
}

export default function BeltApprovalsView() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<BeltVerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<BeltVerificationRequest | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [reviewReason, setReviewReason] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get("/belts/verifications/pending");
            setRequests(res.data.data);
        } catch (error) {
            console.error("Failed to fetch belt verification requests:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to load requests", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (approve: boolean) => {
        if (!selectedRequest) return;

        setIsApproving(true);
        try {
            await api.patch(`/belts/verifications/${selectedRequest.id}`, {
                status: approve ? "APPROVED" : "REJECTED",
                reviewerNotes: reviewReason,
            });

            showToast(
                approve
                    ? `${selectedRequest.student.name}'s ${selectedRequest.requestedBelt} belt has been approved!`
                    : `${selectedRequest.student.name}'s belt request has been rejected`,
                approve ? "success" : "info"
            );

            setShowModal(false);
            setSelectedRequest(null);
            setReviewReason("");
            fetchRequests();
        } catch (error) {
            console.error("Failed to review belt verification:", error);
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || "Failed to process request", "error");
        } finally {
            setIsApproving(false);
        }
    };

    const openModal = (request: BeltVerificationRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setModalAction(action);
        setShowModal(true);
    };

    const getBeltColor = (belt: string) => {
        if (belt.includes("White")) return "bg-gray-200 text-gray-800";
        if (belt.includes("Yellow")) return "bg-yellow-400 text-yellow-900";
        if (belt.includes("Orange")) return "bg-orange-500 text-white";
        if (belt.includes("Blue")) return "bg-blue-500 text-white";
        if (belt.includes("Green")) return "bg-green-600 text-white";
        if (belt.includes("Brown")) return "bg-amber-700 text-white";
        if (belt.includes("Black") || belt.includes("Dan")) return "bg-black text-white border border-yellow-400";
        return "bg-gray-500 text-white";
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
            <div>
                <h1 className="text-3xl font-black text-white mb-2">Belt Verifications</h1>
                <p className="text-gray-400">Review and approve student belt advancement requests.</p>
            </div>

            {requests.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 text-center"
                >
                    <Medal className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Pending Requests</h3>
                    <p className="text-gray-400">All belt verification requests have been reviewed.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((request, index) => (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-6 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between gap-6">
                                {/* Student Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                                        {getImageUrl(request.student.profilePhotoUrl) ? (
                                            <img
                                                src={getImageUrl(request.student.profilePhotoUrl)!}
                                                alt={request.student.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                                {request.student.name[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white truncate">
                                                {request.student.name}
                                            </h3>
                                            <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-white/5 rounded">
                                                {request.student.membershipId}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-400 mb-4">{request.student.email}</p>

                                        {/* Belt Progression */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getBeltColor(request.currentBelt)}`}>
                                                {request.currentBelt}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getBeltColor(request.requestedBelt)}`}>
                                                {request.requestedBelt}
                                            </span>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                <span>Exam Date: {new Date(request.examDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Clock className="w-4 h-4 text-blue-400" />
                                                <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        {request.reason && (
                                            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                                                <div className="flex items-start gap-2">
                                                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student&apos;s Note</p>
                                                        <p className="text-sm text-gray-300">{request.reason}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={() => openModal(request, 'approve')}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => openModal(request, 'reject')}
                                        variant="outline"
                                        className="border-red-500/50 text-red-500 hover:bg-red-950 hover:text-red-400"
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

            {/* Confirmation Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="text-center mb-6">
                            {modalAction === 'approve' ? (
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                            )}
                            <h3 className="text-2xl font-black text-white mb-2">
                                {modalAction === 'approve' ? 'Approve' : 'Reject'} Belt Request
                            </h3>
                            <p className="text-gray-400">
                                {modalAction === 'approve'
                                    ? `Confirm ${selectedRequest.student.name}'s advancement to ${selectedRequest.requestedBelt}`
                                    : `Provide a reason for rejecting this belt request`}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                {modalAction === 'approve' ? 'Notes (Optional)' : 'Reason for Rejection *'}
                            </label>
                            <textarea
                                value={reviewReason}
                                onChange={(e) => setReviewReason(e.target.value)}
                                placeholder={modalAction === 'approve' ? "Add any notes..." : "Explain why this request is being rejected..."}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={4}
                                required={modalAction === 'reject'}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedRequest(null);
                                    setReviewReason("");
                                }}
                                variant="outline"
                                className="flex-1 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                disabled={isApproving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleReview(modalAction === 'approve')}
                                className={`flex-1 ${modalAction === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    } text-white font-bold`}
                                disabled={isApproving || (modalAction === 'reject' && !reviewReason.trim())}
                            >
                                {isApproving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {modalAction === 'approve' ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </>
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
