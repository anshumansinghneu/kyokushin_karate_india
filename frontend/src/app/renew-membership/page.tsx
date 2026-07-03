"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Shield, Clock, Ticket } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function RenewMembershipPage() {
    const { user, isAuthenticated, fetchUser } = useAuthStore();
    const router = useRouter();

    const [paymentStep, setPaymentStep] = useState<"idle" | "redeeming" | "done">("idle");
    const [error, setError] = useState<string | null>(null);
    const [paymentInfo, setPaymentInfo] = useState<{ amount: number; taxAmount: number; totalAmount: number } | null>(null);

    // Voucher state
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState<{ amount: number; code: string } | null>(null);
    const [voucherError, setVoucherError] = useState("");

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const handleValidateVoucher = async () => {
        if (!voucherCode.trim()) return;
        setVoucherValidating(true);
        setVoucherError("");
        setVoucherValid(null);
        try {
            const res = await api.post("/vouchers/validate", { code: voucherCode.trim().toUpperCase() });
            const v = res.data.data;
            if (v.applicableTo !== "MEMBERSHIP" && v.applicableTo !== "ALL") {
                setVoucherError("This voucher is not valid for membership renewal");
                return;
            }
            const totalNeeded = paymentInfo?.totalAmount || 295;
            if (v.amount < totalNeeded) {
                setVoucherError(`Voucher amount (₹${v.amount}) is less than required (₹${totalNeeded})`);
                return;
            }
            setVoucherValid({ amount: v.amount, code: voucherCode.trim().toUpperCase() });
        } catch (err: unknown) {
            const errorMsg = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            setVoucherError(errorMsg || "Invalid voucher code");
        } finally {
            setVoucherValidating(false);
        }
    };

    const handleRenew = async () => {
        if (!voucherValid) {
            setError("Please validate a voucher code first");
            return;
        }
        setError(null);
        setPaymentStep("redeeming");

        try {
            await api.post("/vouchers/redeem/renewal", { code: voucherValid.code });
            setPaymentStep("done");
            await fetchUser();
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err: unknown) {
            const errorMsg = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : (err instanceof Error ? err.message : null);
            setError(errorMsg || "Renewal failed. Please try again.");
            setPaymentStep("idle");
        }
    };

    if (!user) return null;

    const isExpired = user.membershipStatus === "EXPIRED";

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,0,0,0.15),_transparent_60%)] z-0" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8"
            >
                {paymentStep === "done" ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Membership Renewed!</h2>
                        <p className="text-gray-300">Your membership has been extended for 1 year. Redirecting to dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-[#FF0000]/15 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-[#FF4D4D]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {isExpired ? "Membership Expired" : "Renew Membership"}
                                </h2>
                                <p className="text-sm text-gray-300">
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
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Member</p>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.membershipNumber || "Pending"}</p>
                            </div>
                        </div>

                        {paymentInfo && (
                            <div className="p-4 rounded-xl bg-green-500/[0.08] border border-green-500/20 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-bold">Renewal Fee</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Annual Fee</span>
                                        <span>₹{paymentInfo.amount}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>GST (18%)</span>
                                        <span>₹{paymentInfo.taxAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                                        <span>Total</span>
                                        <span className="text-green-400">₹{paymentInfo.totalAmount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-300">
                                    <Shield className="w-3 h-3" />
                                    <span>Pay via cash voucher from your instructor • Valid for 1 year</span>
                                </div>
                            </div>
                        )}

                        {/* Voucher input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                <Ticket className="w-4 h-4 inline mr-1" />
                                Cash Voucher Code <span className="text-[#FF4D4D]">*</span>
                            </label>
                            <p className="text-xs text-gray-400 mb-2">Enter the voucher code provided by your instructor</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={voucherCode}
                                    onChange={(e) => {
                                        setVoucherCode(e.target.value.toUpperCase());
                                        setVoucherValid(null);
                                        setVoucherError("");
                                    }}
                                    placeholder="e.g. KKFI-XXXX-XXXX"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black uppercase tracking-wider"
                                    disabled={!!voucherValid}
                                />
                                {voucherValid ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVoucherValid(null);
                                            setVoucherCode("");
                                            setVoucherError("");
                                        }}
                                        className="px-3 min-h-[44px] bg-transparent border border-white/20 text-white rounded-none text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                    >
                                        Change
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleValidateVoucher}
                                        disabled={!voucherCode.trim() || voucherValidating}
                                        className="px-4 min-h-[44px] bg-[#FF0000] text-white rounded-none text-sm font-bold uppercase tracking-wider hover:bg-[#8B0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                    >
                                        {voucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
                                    </button>
                                )}
                            </div>
                            {voucherValid && (
                                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Voucher valid — ₹{voucherValid.amount} applied
                                </div>
                            )}
                            {voucherError && (
                                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {voucherError}
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleRenew}
                            disabled={paymentStep !== "idle" || !voucherValid}
                            className="w-full h-12 text-base font-bold bg-[#FF0000] hover:bg-[#8B0000] transition-colors rounded-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            {paymentStep === "redeeming" ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Redeeming Voucher...</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Renew with Voucher</>
                            )}
                        </Button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
