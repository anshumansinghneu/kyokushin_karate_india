"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Shield, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";

export default function EventDetailPage() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationStep, setRegistrationStep] = useState(1);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eventType, setEventType] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<{ name: string; age: string; weight: string } | null>(null);

    // Voucher state
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState<{ amount: number; code: string } | null>(null);
    const [voucherError, setVoucherError] = useState("");

    // Feedback state
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [myFeedback, setMyFeedback] = useState<any>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [isEditingFeedback, setIsEditingFeedback] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data.data.event);
            } catch (err) {
                console.error("Failed to fetch event", err);
                setError("Failed to load event details.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    // Fetch feedback for completed events
    useEffect(() => {
        if (!event || event.status !== 'COMPLETED') return;
        const fetchFeedback = async () => {
            try {
                const res = await api.get(`/feedback/${event.id}`);
                setFeedbacks(res.data.data.feedbacks || []);
            } catch { }
            if (user) {
                try {
                    const res = await api.get(`/feedback/${event.id}/mine`);
                    if (res.data.data.feedback) setMyFeedback(res.data.data.feedback);
                } catch { }
            }
        };
        fetchFeedback();
    }, [event?.id, event?.status, user]);

    const handleFeedbackSubmit = async () => {
        if (feedbackText.trim().length < 10) {
            showToast('Feedback must be at least 10 characters', 'error');
            return;
        }
        setSubmittingFeedback(true);
        try {
            if (isEditingFeedback) {
                await api.put(`/feedback/${event.id}`, { feedback: feedbackText });
                showToast('Feedback updated! It will be reviewed again.', 'success');
            } else {
                await api.post(`/feedback/${event.id}`, { feedback: feedbackText });
                showToast('Feedback submitted! It will appear after admin approval.', 'success');
            }
            const res = await api.get(`/feedback/${event.id}/mine`);
            setMyFeedback(res.data.data.feedback);
            setShowFeedbackForm(false);
            setIsEditingFeedback(false);
            setFeedbackText('');
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to submit feedback', 'error');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleRegister = () => {
        if (!user) {
            showToast("Please login to register for this event.", "error");
            return;
        }
        if (user.membershipStatus !== 'ACTIVE') {
            showToast("Only active members can register. Please renew your membership.", "error");
            return;
        }
        setIsRegistering(true);
    };

    const handleValidateEventVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError("Please enter a voucher code");
            return;
        }
        setVoucherValidating(true);
        setVoucherError("");
        setVoucherValid(null);
        try {
            const res = await api.post('/vouchers/validate', {
                code: voucherCode.trim(),
                type: event?.type || 'TOURNAMENT',
                eventId: id,
            });
            setVoucherValid({
                amount: res.data.data.voucher.amount,
                code: res.data.data.voucher.code,
            });
        } catch (err: any) {
            setVoucherError(err.response?.data?.message || "Invalid voucher code");
        } finally {
            setVoucherValidating(false);
        }
    };

    const handleVoucherRedemption = async () => {
        if (!voucherValid) return;
        setPaymentProcessing(true);
        try {
            await api.post(`/vouchers/redeem/event/${id}`, {
                voucherCode: voucherValid.code,
                eventType,
            });
            setRegistrationStep(3);
            showToast("Registration successful! Voucher redeemed.", "success");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Voucher redemption failed.", "error");
        } finally {
            setPaymentProcessing(false);
        }
    };

    // Direct registration for free events
    const handleFreeRegistration = async () => {
        setPaymentProcessing(true);
        try {
            await api.post(`/events/${id}/register`, {
                eventType,
                categoryAge: selectedCategory?.age || null,
                categoryWeight: selectedCategory?.weight || null,
            });
            setRegistrationStep(3);
            showToast("Registration successful!", "success");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Registration failed.", "error");
        } finally {
            setPaymentProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    if (error || !event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">{error || "Event not found"}</div>;

    // Parse categories if string, or use directly if array
    const categories = Array.isArray(event.categories) ? event.categories : [];

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white relative">
            {/* Hero */}
            <div className="relative min-h-[380px] w-full">
                <div className="absolute inset-0">
                    {event.imageUrl ? (
                        <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                </div>

                <div className="absolute inset-0 container-responsive flex flex-col justify-end pb-10 z-10">
                    <Link href="/events" className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2 mb-5 transition-colors w-fit">
                        <ArrowLeft className="w-3.5 h-3.5" /> All Events
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-2.5 py-1 rounded bg-red-600 text-white text-[8px] font-extrabold uppercase tracking-[2px]">
                                {event.type.replace('_', ' ')}
                            </span>
                            {event.status && (
                                <span className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-[2px] ${
                                    event.status === 'COMPLETED' ? 'bg-zinc-700 text-zinc-300' :
                                    'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                }`}>
                                    {event.status}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-4 leading-snug max-w-3xl">
                            {event.name}
                        </h1>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-4 text-[12px] text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-red-500" />
                                {new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-red-500" />
                                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(event.location || event.dojo?.city) && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                    {event.location || event.dojo?.city}
                                </span>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container-responsive py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Description */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-lg font-black uppercase tracking-tight mb-5 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Event Overview
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            {event.description}
                        </p>
                    </motion.section>

                    {/* Categories */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-lg font-black uppercase tracking-tight mb-5 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Categories
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map((cat: any, i: number) => (
                                <div key={i} className="glass-card p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-white">{cat.name}</h4>
                                        <p className="text-sm text-gray-400">Age: {cat.age}</p>
                                    </div>
                                    <span className="px-3 py-1 rounded bg-white/5 text-primary font-mono text-sm border border-white/10">
                                        {cat.weight}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Schedule (Mock for now as it's not in DB model explicitly as array) */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-lg font-black uppercase tracking-tight mb-5 flex items-center gap-3">
                            <div className="w-[3px] h-5 rounded-full bg-red-600" />
                            Event Schedule
                        </h2>
                        <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                            <div className="flex items-center gap-6 relative">
                                <div className="w-10 h-10 rounded-full bg-black border-2 border-primary flex items-center justify-center z-10">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div className="glass-card p-4 flex-1 flex justify-between items-center">
                                    <span className="font-bold text-white">Start Time</span>
                                    <span className="text-sm font-mono text-gray-400">{new Date(event.startDate).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 relative">
                                <div className="w-10 h-10 rounded-full bg-black border-2 border-primary flex items-center justify-center z-10">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div className="glass-card p-4 flex-1 flex justify-between items-center">
                                    <span className="font-bold text-white">End Time</span>
                                    <span className="text-sm font-mono text-gray-400">{new Date(event.endDate).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Feedback Section — only for completed events */}
                    {event.status === 'COMPLETED' && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-1 h-8 bg-primary rounded-full" />
                                Feedback
                            </h2>

                            {/* My feedback status */}
                            {user && myFeedback && !showFeedbackForm && (
                                <div className="glass-card p-4 mb-6 border-l-4 border-yellow-500/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Your feedback</p>
                                            <p className="text-white">{myFeedback.feedback}</p>
                                            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                                                myFeedback.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                                myFeedback.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {myFeedback.status === 'PENDING' ? 'Awaiting Approval' : myFeedback.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => { setFeedbackText(myFeedback.feedback); setIsEditingFeedback(true); setShowFeedbackForm(true); }}
                                            className="text-xs text-gray-500 hover:text-white transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit/Edit form */}
                            {user && showFeedbackForm && (
                                <div className="glass-card p-4 mb-6">
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Share your experience... (min 10 characters)"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
                                        rows={4}
                                        maxLength={2000}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500">{feedbackText.length}/2000</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setShowFeedbackForm(false); setIsEditingFeedback(false); setFeedbackText(''); }}
                                                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleFeedbackSubmit}
                                                disabled={submittingFeedback || feedbackText.trim().length < 10}
                                                className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {submittingFeedback ? 'Submitting...' : isEditingFeedback ? 'Update' : 'Submit'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Write feedback button */}
                            {user && !myFeedback && !showFeedbackForm && (
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="glass-card p-4 mb-6 w-full text-left hover:bg-white/5 transition-colors border border-dashed border-white/10 rounded-xl"
                                >
                                    <p className="text-gray-400 text-sm">Participated in this event? Share your feedback!</p>
                                </button>
                            )}

                            {/* Approved feedback list */}
                            {feedbacks.length > 0 ? (
                                <div className="space-y-4">
                                    {feedbacks.map((fb: any) => (
                                        <div key={fb.id} className="glass-card p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                    {fb.user?.name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{fb.user?.name}</p>
                                                    <p className="text-xs text-gray-500">{fb.user?.currentBeltRank?.replace('_', ' ')} &bull; {new Date(fb.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 text-sm">{fb.feedback}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !showFeedbackForm && (
                                    <p className="text-zinc-600 text-sm">No feedback yet.</p>
                                )
                            )}
                        </motion.section>
                    )}
                </div>

                {/* Right Column: Registration */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 sticky top-24"
                    >
                        {!isRegistering ? (
                            <>
                                <div className="mb-5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Registration Fee</p>
                                    <p className="text-3xl font-black text-white">₹{event.memberFee}</p>
                                </div>

                                <div className="space-y-2.5 mb-6 pb-5 border-b border-white/[0.05]">
                                    <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Official Tournament T-Shirt</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Participation Certificate</span>
                                    </div>
                                </div>

                                <Button onClick={handleRegister} className="w-full h-12 text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-zinc-200 rounded-xl">
                                    Register Now
                                </Button>
                                <p className="text-center text-xs text-gray-500 mt-4">
                                    Registration closes on {new Date(event.registrationDeadline).toLocaleDateString()}
                                </p>
                            </>
                        ) : (
                            <div className="space-y-6">
                                {registrationStep === 1 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="text-xl font-bold text-white mb-4">Select Event Type</h3>
                                        <div className="space-y-4 mb-6">
                                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Event Type *</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['Kata', 'Kumite', 'Both'].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setEventType(type)}
                                                        className={`p-3 rounded-lg border text-sm font-bold transition-all ${eventType === type
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Category Selection (if event has categories) */}
                                        {categories.length > 0 && (
                                            <div className="space-y-4 mb-6">
                                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Competition Category *</label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                    {categories.map((cat: any, i: number) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                                                                selectedCategory?.name === cat.name && selectedCategory?.age === cat.age
                                                                    ? 'bg-primary/10 text-white border-primary'
                                                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            <span className="font-bold text-sm">{cat.name}</span>
                                                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                                {cat.age && <span>Age: {cat.age}</span>}
                                                                {cat.weight && <span>Weight: {cat.weight}</span>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            onClick={() => setRegistrationStep(2)}
                                            disabled={!eventType || (categories.length > 0 && !selectedCategory)}
                                            className="w-full bg-primary hover:bg-primary-dark"
                                        >
                                            Continue
                                        </Button>
                                        <Button variant="ghost" onClick={() => setIsRegistering(false)} className="w-full mt-2">
                                            Cancel
                                        </Button>
                                    </motion.div>
                                )}

                                {registrationStep === 2 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="text-xl font-bold text-white mb-4">Confirm Registration</h3>
                                        <div className="space-y-4 mb-6 text-sm">
                                            <div className="flex justify-between text-gray-400">
                                                <span>Event</span>
                                                <span className="text-white text-right w-1/2">{event.name}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Type</span>
                                                <span className="text-white font-bold">{eventType}</span>
                                            </div>
                                            {selectedCategory && (
                                                <div className="flex justify-between text-gray-400">
                                                    <span>Category</span>
                                                    <span className="text-white font-bold text-right">{selectedCategory.name}{selectedCategory.weight ? ` (${selectedCategory.weight})` : ''}</span>
                                                </div>
                                            )}
                                            {!voucherValid && (
                                                <div className="flex justify-between text-gray-400 border-t border-white/10 pt-4">
                                                    <span>Total Amount</span>
                                                    <span className="text-xl font-bold text-primary">₹{event.memberFee}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Voucher Section - mandatory for paid events */}
                                        {event.memberFee > 0 ? (
                                            <div className="mb-6 space-y-3">
                                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Cash Voucher Code *</label>
                                                <p className="text-xs text-zinc-500">Enter the voucher code provided by your instructor</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        placeholder="e.g. KKFI-XXXX-XXXX"
                                                        value={voucherCode}
                                                        onChange={(e) => {
                                                            setVoucherCode(e.target.value.toUpperCase());
                                                            setVoucherError("");
                                                            setVoucherValid(null);
                                                        }}
                                                        disabled={!!voucherValid}
                                                        className="flex-1 bg-zinc-950/50 border border-white/10 focus:border-green-500 h-10 rounded-lg text-white placeholder:text-zinc-600 font-mono tracking-wider px-3 text-sm outline-none"
                                                    />
                                                    {voucherValid ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setVoucherValid(null);
                                                                setVoucherCode("");
                                                                setVoucherError("");
                                                            }}
                                                            className="px-3 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-600 transition-colors"
                                                        >
                                                            Change
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleValidateEventVoucher}
                                                            disabled={voucherValidating || !voucherCode.trim()}
                                                            className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all disabled:opacity-50"
                                                        >
                                                            {voucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
                                                        </button>
                                                    )}
                                                </div>

                                                {voucherError && (
                                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {voucherError}
                                                    </div>
                                                )}

                                                {voucherValid && (
                                                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                                                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-bold text-green-400">Voucher Valid!</p>
                                                            <p className="text-xs text-gray-400">Covers ₹{voucherValid.amount} — registration fee covered.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        {event.memberFee > 0 ? (
                                            <Button onClick={handleVoucherRedemption} disabled={paymentProcessing || !voucherValid} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50">
                                                {paymentProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redeeming...</> : <><CheckCircle className="w-4 h-4 mr-2" /> Register with Voucher</>}
                                            </Button>
                                        ) : (
                                            <Button onClick={handleFreeRegistration} disabled={paymentProcessing} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50">
                                                {paymentProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</> : <><CheckCircle className="w-4 h-4 mr-2" /> Register (Free)</>}
                                            </Button>
                                        )}
                                        <Button variant="ghost" onClick={() => setRegistrationStep(1)} className="w-full mt-2">
                                            Back
                                        </Button>
                                    </motion.div>
                                )}

                                {registrationStep === 3 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
                                        <p className="text-gray-400 mb-6">Your spot has been confirmed. Good luck!</p>
                                        <Link href="/dashboard">
                                            <Button className="w-full">Go to Dashboard</Button>
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
