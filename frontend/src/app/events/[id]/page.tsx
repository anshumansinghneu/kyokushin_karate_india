"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Shield, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";

declare global {
    interface Window { Razorpay: any; }
}

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

    const handlePayment = async () => {
        try {
            setPaymentProcessing(true);

            // Step 1: Create Razorpay order via backend
            const orderRes = await api.post(`/payments/tournament/${id}/create-order`);
            const orderData = orderRes.data.data;

            // Step 2: Open Razorpay checkout
            if (!window.Razorpay) {
                throw new Error("Payment gateway not loaded. Please refresh and try again.");
            }

            const options = {
                key: orderData.keyId,
                amount: Math.round(orderData.totalAmount * 100),
                currency: orderData.currency || "INR",
                name: "Kyokushin Karate India",
                description: `Event Registration - ${orderData.eventName || event.name}`,
                order_id: orderData.orderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                },
                notes: { type: "tournament_registration", eventId: id },
                theme: { color: "#DC2626" },
                modal: {
                    ondismiss: () => {
                        setPaymentProcessing(false);
                        showToast("Payment cancelled.", "error");
                    },
                },
                handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                    // Step 3: Verify payment & complete registration
                    try {
                        await api.post("/payments/tournament/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            eventType,
                            categoryAge: null,
                            categoryWeight: null,
                            categoryBelt: null,
                        });
                        setRegistrationStep(3);
                        showToast("Registration successful! Payment verified.", "success");
                    } catch (err: any) {
                        console.error("Payment verification failed", err);
                        showToast(err.response?.data?.message || "Payment verification failed.", "error");
                    } finally {
                        setPaymentProcessing(false);
                    }
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", (response: any) => {
                console.error("Payment failed:", response.error);
                setPaymentProcessing(false);
                showToast(`Payment failed: ${response.error?.description || "Please try again."}`, "error");
            });
            razorpay.open();

        } catch (error: any) {
            console.error("Registration failed", error);
            setPaymentProcessing(false);
            showToast(error.response?.data?.message || "Registration failed. Please try again.", "error");
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    if (error || !event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">{error || "Event not found"}</div>;

    // Parse categories if string, or use directly if array
    const categories = Array.isArray(event.categories) ? event.categories : [];

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
            {/* Hero Section */}
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0">
                    {event.imageUrl ? (
                        <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    {/* Fallback Gradient (shown if no image or on error) */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-red-900/50 to-black/50 mix-blend-overlay ${event.imageUrl ? 'hidden' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
                </div>

                <div className="absolute inset-0 container mx-auto px-6 md:px-4 flex flex-col justify-end pb-12 z-10">
                    <Link href="/events" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Events
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-bold uppercase tracking-wider border border-red-500/20 mb-4 inline-block">
                            {event.type}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">{event.name}</h1>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 text-base sm:text-lg text-gray-300 mb-8">
                            <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> {new Date(event.startDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {event.location || event.dojo?.city || 'TBD'}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Description */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-1 h-8 bg-primary rounded-full" />
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
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-1 h-8 bg-primary rounded-full" />
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
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-1 h-8 bg-primary rounded-full" />
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
                </div>

                {/* Right Column: Registration */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-8 sticky top-8"
                    >
                        {!isRegistering ? (
                            <>
                                <div className="text-center mb-8">
                                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Registration Fee</p>
                                    <p className="text-5xl font-black text-white">₹{event.memberFee}</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Official Tournament T-Shirt</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Participation Certificate</span>
                                    </div>
                                </div>

                                <Button onClick={handleRegister} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20">
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
                                        <Button
                                            onClick={() => setRegistrationStep(2)}
                                            disabled={!eventType}
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
                                            <div className="flex justify-between text-gray-400 border-t border-white/10 pt-4">
                                                <span>Total Amount</span>
                                                <span className="text-xl font-bold text-primary">₹{event.memberFee}</span>
                                            </div>
                                        </div>
                                        <Button onClick={handlePayment} disabled={paymentProcessing} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50">
                                            {paymentProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Confirm & Pay'}
                                        </Button>
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
                                        <p className="text-gray-400 mb-6">Payment verified. Your spot has been confirmed. Good luck!</p>
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
