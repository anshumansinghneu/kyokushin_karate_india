"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        setToasts((prev) => {
            // Prevent duplicate messages
            if (prev.some(t => t.message === message)) {
                return prev;
            }

            // Limit max toasts to 3
            const newToasts = prev.length >= 3 ? prev.slice(1) : prev;

            const id = Math.random().toString(36).substr(2, 9);
            const toast = { id, message, type };

            // Auto remove after 5 seconds
            setTimeout(() => {
                setToasts((current) => current.filter((t) => t.id !== id));
            }, 5000);

            return [...newToasts, toast];
        });
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 max-w-md">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm border
                                ${toast.type === "success" ? "bg-green-500/20 border-green-500/50 text-green-100" : ""}
                                ${toast.type === "error" ? "bg-red-500/20 border-red-500/50 text-red-100" : ""}
                                ${toast.type === "info" ? "bg-blue-500/20 border-blue-500/50 text-blue-100" : ""}
                            `}
                        >
                            {toast.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                            {toast.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            {toast.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
                            <p className="flex-1 text-sm font-medium">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
