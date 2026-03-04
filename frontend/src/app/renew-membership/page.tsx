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
                                    <span>Pay via cash voucher from your instructor • Valid for 1 year</span>
                                </div>
                            </div>
                        )}

                        {/* Voucher input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <Ticket className="w-4 h-4 inline mr-1" />
                                Cash Voucher Code <span className="text-red-400">*</span>
                            </label>
                            <p className="text-xs text-zinc-500 mb-2">Enter the voucher code provided by your instructor</p>
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
                                    className="flex-1 bg-zinc-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 uppercase tracking-wider"
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
                                        className="px-3 py-2.5 bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
                                    >
                                        Change
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleValidateVoucher}
                                        disabled={!voucherCode.trim() || voucherValidating}
                                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 transition-all rounded-lg disabled:opacity-50"
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
