"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, MailOpen, Archive, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function AnonymousMessageManager() {
    const { showToast } = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20', filter });
            const res = await api.get(`/anonymous-messages?${params}`);
            setMessages(res.data.data.messages || []);
            setTotal(res.data.data.total || 0);
            setUnreadCount(res.data.data.unreadCount || 0);
            setTotalPages(res.data.data.totalPages || 1);
        } catch {
            showToast("Failed to load messages", "error");
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleMarkRead = async (id: string) => {
        try {
            await api.patch(`/anonymous-messages/${id}/read`);
            fetchMessages();
        } catch {
            showToast("Failed to mark as read", "error");
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await api.patch(`/anonymous-messages/${id}/archive`);
            showToast("Message archived", "success");
            fetchMessages();
        } catch {
            showToast("Failed to archive", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Anonymous Messages</h2>
                    <p className="text-sm text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'No unread messages'} &bull; {total} total
                    </p>
                </div>
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'Inbox' },
                        { key: 'unread', label: 'Unread' },
                        { key: 'archived', label: 'Archived' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => { setFilter(f.key); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filter === f.key
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No {filter === 'unread' ? 'unread ' : filter === 'archived' ? 'archived ' : ''}messages</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg: any) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-xl p-4 transition-colors ${
                                msg.isRead
                                    ? 'bg-white/[0.02] border-white/[0.06]'
                                    : 'bg-white/[0.05] border-primary/20'
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.isRead ? (
                                            <MailOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                        ) : (
                                            <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {new Date(msg.createdAt).toLocaleDateString()} at{' '}
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {!msg.isRead && (
                                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px] font-bold">NEW</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {!msg.isRead && (
                                        <button
                                            onClick={() => handleMarkRead(msg.id)}
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                            title="Mark as read"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                    {!msg.isArchived && (
                                        <button
                                            onClick={() => handleArchive(msg.id)}
                                            className="p-2 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors"
                                            title="Archive"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
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
