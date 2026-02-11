'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
    target?: string; // CSS selector for highlight
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const STUDENT_STEPS: TourStep[] = [
    {
        title: 'Welcome to KKFI! 🥋',
        description: 'This is your personal dojo dashboard. Let\'s take a quick tour to help you get started.',
    },
    {
        target: '[data-tour="membership-card"]',
        title: 'Your Membership Card',
        description: 'This is your digital ID card with a QR code. Download it or share it to verify your membership.',
        position: 'right',
    },
    {
        target: '[data-tour="quick-stats"]',
        title: 'Quick Stats',
        description: 'Track your belt rank, tournaments, events, and membership status at a glance.',
        position: 'right',
    },
    {
        target: '[data-tour="quick-links"]',
        title: 'Quick Links',
        description: 'Access your payments, calendar, and verification portal from here.',
        position: 'top',
    },
    {
        title: 'You\'re All Set! 🔥',
        description: 'Explore your dashboard, register for events, and track your Kyokushin journey. OSU!',
    },
];

const TOUR_KEY = 'kkfi-onboarding-complete';

export default function OnboardingTour({ role = 'STUDENT' }: { role?: string }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = STUDENT_STEPS; // Can branch by role later

    useEffect(() => {
        const completed = localStorage.getItem(TOUR_KEY);
        if (!completed) {
            // Delay start so dashboard renders first
            const timer = setTimeout(() => setIsActive(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const updateTargetRect = useCallback(() => {
        const step = steps[currentStep];
        if (step.target) {
            const el = document.querySelector(step.target);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
        setTargetRect(null);
    }, [currentStep, steps]);

    useEffect(() => {
        if (isActive) {
            updateTargetRect();
            window.addEventListener('resize', updateTargetRect);
            return () => window.removeEventListener('resize', updateTargetRect);
        }
    }, [isActive, updateTargetRect]);

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finish();
        }
    };

    const prev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const finish = () => {
        setIsActive(false);
        localStorage.setItem(TOUR_KEY, 'true');
    };

    if (!isActive) return null;

    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    // Position the tooltip near the target
    const tooltipStyle: React.CSSProperties = {};
    if (targetRect) {
        const pos = step.position || 'bottom';
        if (pos === 'bottom') {
            tooltipStyle.top = targetRect.bottom + 16;
            tooltipStyle.left = Math.max(16, targetRect.left + targetRect.width / 2 - 175);
        } else if (pos === 'top') {
            tooltipStyle.bottom = window.innerHeight - targetRect.top + 16;
            tooltipStyle.left = Math.max(16, targetRect.left + targetRect.width / 2 - 175);
        } else if (pos === 'right') {
            tooltipStyle.top = targetRect.top + targetRect.height / 2 - 60;
            tooltipStyle.left = targetRect.right + 16;
        } else {
            tooltipStyle.top = targetRect.top + targetRect.height / 2 - 60;
            tooltipStyle.right = window.innerWidth - targetRect.left + 16;
        }
    }

    return (
        <AnimatePresence>
            {isActive && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                        onClick={finish}
                    />

                    {/* Spotlight cutout on target */}
                    {targetRect && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed z-[9999] rounded-2xl ring-4 ring-red-500 ring-offset-4 ring-offset-transparent pointer-events-none"
                            style={{
                                top: targetRect.top - 8,
                                left: targetRect.left - 8,
                                width: targetRect.width + 16,
                                height: targetRect.height + 16,
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                            }}
                        />
                    )}

                    {/* Tooltip */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="fixed z-[10000] w-[350px] max-w-[90vw]"
                        style={targetRect ? tooltipStyle : {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div className="bg-zinc-900 border border-white/15 rounded-2xl p-6 shadow-2xl shadow-black/50">
                            <button onClick={finish} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>

                            {(isFirst || isLast) && (
                                <div className="flex justify-center mb-3">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-red-500" />
                                    </div>
                                </div>
                            )}

                            <h3 className="text-lg font-black text-white mb-2 text-center">{step.title}</h3>
                            <p className="text-sm text-gray-400 mb-5 text-center leading-relaxed">{step.description}</p>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-1.5 mb-4">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            i === currentStep ? 'w-6 bg-red-500' : 'w-1.5 bg-white/20'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Nav buttons */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={finish}
                                    className="text-xs text-gray-500 hover:text-white transition-colors font-semibold"
                                >
                                    Skip Tour
                                </button>
                                <div className="flex gap-2">
                                    {!isFirst && (
                                        <button
                                            onClick={prev}
                                            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back
                                        </button>
                                    )}
                                    <button
                                        onClick={next}
                                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center gap-1"
                                    >
                                        {isLast ? 'Get Started' : 'Next'} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
