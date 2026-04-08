"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function EventReviewManager() {
    const { showToast } = useToast();
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [loading, setLoading] = useState(true);

    const fetchFeedbacks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/feedback/all?${params}`);
            setFeedbacks(res.data.data.feedbacks || []);
            setTotal(res.data.data.total || 0);
            setTotalPages(res.data.data.totalPages || 1);
        } catch {
            showToast("Failed to load feedback", "error");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            await api.patch(`/feedback/${id}/${action}`);
            showToast(`Feedback ${action}d`, "success");
            fetchFeedbacks();
        } catch {
            showToast(`Failed to ${action} feedback`, "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Event Reviews</h2>
                    <p className="text-sm text-gray-500">{total} total feedback entries</p>
                </div>
                <div className="flex gap-2">
                    {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === s
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : feedbacks.length === 0 ? (
                <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No {statusFilter.toLowerCase()} feedback</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {feedbacks.map((fb: any) => (
                        <motion.div
                            key={fb.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white">{fb.user?.name}</span>
                                        <span className="text-xs text-gray-600">&bull;</span>
                                        <span className="text-xs text-gray-500">{fb.user?.currentBeltRank?.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-xs text-primary mb-2">{fb.event?.name}</p>
                                    <p className="text-sm text-gray-300">{fb.feedback}</p>
                                    <p className="text-xs text-gray-600 mt-2">{new Date(fb.createdAt).toLocaleDateString()}</p>
                                </div>
                                {statusFilter === 'PENDING' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleAction(fb.id, 'approve')}
                                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                            title="Approve"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(fb.id, 'reject')}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                            title="Reject"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
