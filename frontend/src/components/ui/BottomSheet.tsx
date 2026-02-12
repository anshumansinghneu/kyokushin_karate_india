'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    /** Max height as vh percentage (default: 85) */
    maxHeight?: number;
}

export default function BottomSheet({ isOpen, onClose, title, children, maxHeight = 85 }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKey);
        }
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // If user drags down more than 100px, close the sheet
        if (info.offset.y > 100) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragControls={dragControls}
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className="fixed bottom-0 left-0 right-0 z-[201] bg-zinc-900 border-t border-white/10 rounded-t-3xl overflow-hidden"
                        style={{ maxHeight: `${maxHeight}vh`, touchAction: 'none' }}
                    >
                        {/* Drag handle */}
                        <div
                            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="overflow-y-auto overscroll-contain px-5 py-4"
                            style={{
                                maxHeight: `calc(${maxHeight}vh - 80px)`,
                                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                                WebkitOverflowScrolling: 'touch',
                            }}
                        >
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
