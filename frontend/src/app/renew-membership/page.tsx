"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Shield, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

export default function RenewMembershipPage() {
    const { user, isAuthenticated, checkAuth } = useAuthStore();
    const router = useRouter();

    const [paymentStep, setPaymentStep] = useState<"idle" | "creating" | "paying" | "verifying" | "done">("idle");
    const [error, setError] = useState<string | null>(null);
    const [paymentInfo, setPaymentInfo] = useState<{ amount: number; taxAmount: number; totalAmount: number } | null>(null);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        // Fetch payment config
        const fetchConfig = async () => {
            try {
                const res = await api.get("/payments/config");
                setPaymentInfo({
                    amount: res.data.data.membershipFee,
                    taxAmount: res.data.data.taxAmount,
                    totalAmount: res.data.data.totalAmount,
                });
            } catch {
                setPaymentInfo({ amount: 250, taxAmount: 45, totalAmount: 295 });
            }
        };
        fetchConfig();

        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const handleRenew = async () => {
        setError(null);
        setPaymentStep("creating");

        try {
            const res = await api.post("/payments/renewal/create-order");
            const orderData = res.data.data;

            if (!window.Razorpay) {
                throw new Error("Payment gateway not loaded. Please refresh.");
            }

            setPaymentStep("paying");

            const options = {
                key: orderData.keyId,
                amount: Math.round(orderData.totalAmount * 100),
                currency: "INR",
                name: "Kyokushin Karate India",
                description: "Annual Membership Renewal",
                order_id: orderData.orderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                },
                theme: { color: "#DC2626" },
                modal: {
                    ondismiss: () => setPaymentStep("idle"),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: async (response: any) => {
                    try {
                        setPaymentStep("verifying");
                        await api.post("/payments/renewal/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setPaymentStep("done");
                        // Refresh user data
                        await checkAuth();
                        setTimeout(() => router.push("/dashboard"), 2000);
                    } catch (err: unknown) {
                        const errorMsg = err && typeof err === 'object' && 'response' in err
                            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                            : null;
                        setError(errorMsg || "Verification failed");
                        setPaymentStep("idle");
                    }
                },
            };

            const razorpay = new window.Razorpay(options);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            razorpay.on("payment.failed", (response: any) => {
                setError(response.error.description || "Payment failed");
                setPaymentStep("idle");
            });
            razorpay.open();
        } catch (err: unknown) {
            const errorMsg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message
                : (err instanceof Error ? err.message : null);
            setError(errorMsg || "Failed to create order");
            setPaymentStep("idle");
        }
    };

    if (!user) return null;

    const isExpired = user.membershipStatus === "EXPIRED";

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-black z-0" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-md w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
                {paymentStep === "done" ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Membership Renewed!</h2>
                        <p className="text-zinc-400">Your membership has been extended for 1 year. Redirecting to dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {isExpired ? "Membership Expired" : "Renew Membership"}
                                </h2>
                                <p className="text-sm text-zinc-400">
                                    {isExpired
                                        ? "Your annual membership has expired. Please renew to continue."
                                        : "Extend your membership for another year."
                                    }
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-xs text-zinc-500 uppercase">Member</p>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-zinc-400">{user.membershipNumber || "Pending"}</p>
                            </div>
                        </div>

                        {paymentInfo && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-bold">Renewal Fee</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Annual Fee</span>
                                        <span>₹{paymentInfo.amount}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>GST (18%)</span>
                                        <span>₹{paymentInfo.taxAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                                        <span>Total</span>
                                        <span className="text-green-400">₹{paymentInfo.totalAmount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                                    <Shield className="w-3 h-3" />
                                    <span>Secure payment via UPI / Card • Valid for 1 year</span>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleRenew}
                            disabled={paymentStep !== "idle"}
                            className="w-full h-12 text-base font-bold bg-red-600 hover:bg-red-700 transition-all rounded-lg"
                        >
                            {paymentStep === "creating" ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Order...</>
                            ) : paymentStep === "paying" ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Awaiting Payment...</>
                            ) : paymentStep === "verifying" ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</>
                            ) : (
                                <>Pay ₹{paymentInfo?.totalAmount || 295} & Renew</>
                            )}
                        </Button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
