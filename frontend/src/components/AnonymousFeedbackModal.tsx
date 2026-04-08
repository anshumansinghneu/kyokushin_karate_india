"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function AnonymousFeedbackModal({ isOpen, onClose }: Props) {
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (message.trim().length < 10) {
            showToast('Message must be at least 10 characters', 'error');
            return;
        }
        setSending(true);
        try {
            await api.post('/anonymous-messages', { message: message.trim() });
            showToast('Message sent anonymously', 'success');
            setMessage('');
            onClose();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Anonymous Feedback</h3>
                            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                            <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-green-400/80">
                                Your identity will not be visible to anyone. Share honest feedback, suggestions, or concerns.
                            </p>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your message..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:border-primary focus:outline-none resize-none text-sm"
                            rows={5}
                            maxLength={2000}
                        />
                        <div className="flex justify-between items-center mt-2 mb-4">
                            <span className="text-xs text-gray-600">{message.length}/2000</span>
                            <span className="text-xs text-gray-600">Min 10 characters</span>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sending || message.trim().length < 10}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {sending ? 'Sending...' : 'Send Anonymously'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
