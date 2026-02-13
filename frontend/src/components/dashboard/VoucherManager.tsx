"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Plus, Copy, CheckCircle, XCircle, Clock, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Voucher {
    id: string;
    code: string;
    amount: number;
    applicableTo: string;
    specificEvent?: { id: string; name: string } | null;
    expiryDate: string;
    isActive: boolean;
    isRedeemed: boolean;
    redeemedByUser?: { id: string; name: string; email: string } | null;
    redeemedAt?: string | null;
    creator?: { id: string; name: string } | null;
    createdAt: string;
}

interface Event {
    id: string;
    name: string;
    memberFee: number;
    type: string;
}

export default function VoucherManager() {
    const { showToast } = useToast();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Create form state
    const [applicableTo, setApplicableTo] = useState<string>("MEMBERSHIP");
    const [specificEventId, setSpecificEventId] = useState<string>("");
    const [expiryDays, setExpiryDays] = useState<number>(30);
    const [customAmount, setCustomAmount] = useState<string>("");

    useEffect(() => {
        fetchVouchers();
        fetchEvents();
    }, []);

    const fetchVouchers = async () => {
        try {
            const res = await api.get('/vouchers/all');
            setVouchers(res.data.data.vouchers);
        } catch (err) {
            console.error("Failed to fetch vouchers", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data.data.events || []);
        } catch (err) {
            console.error("Failed to fetch events", err);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            const payload: any = {
                applicableTo,
                expiryDays,
            };

            if (applicableTo !== 'MEMBERSHIP' && specificEventId) {
                payload.specificEventId = specificEventId;
            }

            if (applicableTo !== 'MEMBERSHIP' && !specificEventId && customAmount) {
                payload.amount = parseFloat(customAmount);
            }

            const res = await api.post('/vouchers/create', payload);
            showToast(`Voucher created! Code: ${res.data.data.voucher.code}`, "success");
            setShowCreate(false);
            setApplicableTo("MEMBERSHIP");
            setSpecificEventId("");
            setExpiryDays(30);
            setCustomAmount("");
            fetchVouchers();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to create voucher", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await api.patch(`/vouchers/${id}/deactivate`);
            showToast("Voucher deactivated", "success");
            fetchVouchers();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to deactivate", "error");
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getStatusBadge = (voucher: Voucher) => {
        if (voucher.isRedeemed) {
            return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Redeemed</span>;
        }
        if (!voucher.isActive) {
            return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">Deactivated</span>;
        }
        if (new Date(voucher.expiryDate) < new Date()) {
            return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Expired</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">Active</span>;
    };

    const activeVouchers = vouchers.filter(v => v.isActive && !v.isRedeemed && new Date(v.expiryDate) > new Date());
    const usedVouchers = vouchers.filter(v => v.isRedeemed);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Cash Vouchers</h1>
                    <p className="text-gray-400">Create and manage one-time cash payment vouchers for students.</p>
                </div>
                <Button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create Voucher
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Active</p>
                    <p className="text-3xl font-black text-white">{activeVouchers.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Redeemed</p>
                    <p className="text-3xl font-black text-white">{usedVouchers.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Created</p>
                    <p className="text-3xl font-black text-white">{vouchers.length}</p>
                </div>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-red-500" />
                                Create New Voucher
                            </h3>

                            {/* Voucher Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Voucher For *</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { value: 'MEMBERSHIP', label: 'Membership' },
                                        { value: 'TOURNAMENT', label: 'Tournament' },
                                        { value: 'CAMP', label: 'Camp' },
                                        { value: 'ALL', label: 'Any Purpose' },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => {
                                                setApplicableTo(type.value);
                                                setSpecificEventId("");
                                                setCustomAmount("");
                                            }}
                                            className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                                                applicableTo === type.value
                                                    ? 'bg-red-600 text-white border-red-600'
                                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Event Selection (for non-membership) */}
                            {applicableTo !== 'MEMBERSHIP' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Select Event (Optional)</label>
                                    <select
                                        value={specificEventId}
                                        onChange={(e) => setSpecificEventId(e.target.value)}
                                        className="w-full h-11 rounded-lg border border-white/10 bg-zinc-950/50 px-3 text-white text-sm focus:outline-none focus:border-red-500"
                                    >
                                        <option value="" className="bg-zinc-900">No specific event (enter custom amount)</option>
                                        {events.filter(e => e.memberFee && e.memberFee > 0).map(evt => (
                                            <option key={evt.id} value={evt.id} className="bg-zinc-900">
                                                {evt.name} — ₹{evt.memberFee}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">
                                        {specificEventId
                                            ? `Amount will be auto-set to the event fee`
                                            : 'Select an event to auto-fill amount, or enter custom amount below'
                                        }
                                    </p>

                                    {/* Custom amount if no event selected */}
                                    {!specificEventId && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-400">Custom Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={customAmount}
                                                onChange={(e) => setCustomAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full h-11 rounded-lg border border-white/10 bg-zinc-950/50 px-3 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {applicableTo === 'MEMBERSHIP' && (
                                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                                    <p className="text-sm text-green-400">
                                        <strong>Amount: ₹295</strong> (₹250 + 18% GST) — auto-calculated for membership
                                    </p>
                                </div>
                            )}

                            {/* Expiry Days */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Expiry (Days)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[7, 15, 30, 60].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setExpiryDays(days)}
                                            className={`p-2 rounded-lg border text-sm font-bold transition-all ${
                                                expiryDays === days
                                                    ? 'bg-white/10 text-white border-white/30'
                                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {days} days
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Create Button */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCreate}
                                    disabled={creating || (applicableTo !== 'MEMBERSHIP' && !specificEventId && !customAmount)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                >
                                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <><Ticket className="w-4 h-4 mr-2" /> Generate Voucher</>}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowCreate(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voucher List */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">All Vouchers</h3>

                {vouchers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Ticket className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-bold">No vouchers yet</p>
                        <p className="text-sm">Create your first cash voucher for a student.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {vouchers.map((voucher) => (
                            <motion.div
                                key={voucher.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                    voucher.isRedeemed
                                        ? 'bg-blue-500/5 border-blue-500/20'
                                        : !voucher.isActive
                                        ? 'bg-red-500/5 border-red-500/20 opacity-60'
                                        : 'bg-white/5 border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        voucher.isRedeemed ? 'bg-blue-500/20' : !voucher.isActive ? 'bg-red-500/20' : 'bg-green-500/20'
                                    }`}>
                                        <Ticket className={`w-5 h-5 ${
                                            voucher.isRedeemed ? 'text-blue-400' : !voucher.isActive ? 'text-red-400' : 'text-green-400'
                                        }`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <code className="text-sm font-bold text-white font-mono tracking-wider">{voucher.code}</code>
                                            <button
                                                onClick={() => copyCode(voucher.code)}
                                                className="p-1 rounded hover:bg-white/10 transition-colors"
                                                title="Copy code"
                                            >
                                                {copiedCode === voucher.code ? (
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                )}
                                            </button>
                                            {getStatusBadge(voucher)}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                                            <span>₹{voucher.amount}</span>
                                            <span>{voucher.applicableTo}</span>
                                            {voucher.specificEvent && <span>Event: {voucher.specificEvent.name}</span>}
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expires: {new Date(voucher.expiryDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {voucher.isRedeemed && voucher.redeemedByUser && (
                                            <p className="text-xs text-blue-400 mt-1">
                                                Redeemed by: {voucher.redeemedByUser.name} ({voucher.redeemedByUser.email})
                                                {voucher.redeemedAt && ` • ${new Date(voucher.redeemedAt).toLocaleDateString()}`}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0">
                                    {voucher.isActive && !voucher.isRedeemed && (
                                        <button
                                            onClick={() => handleDeactivate(voucher.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold flex items-center gap-1"
                                            title="Deactivate voucher"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Deactivate
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
