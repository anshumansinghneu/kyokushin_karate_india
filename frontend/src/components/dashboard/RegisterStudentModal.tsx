"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, User, Mail, Phone, Calendar, Ruler, Weight, Shield,
    ChevronRight, ChevronLeft, CheckCircle, Ticket, Loader2,
    AlertCircle, Copy, Eye, EyeOff, UserPlus
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { INDIAN_STATES, CITIES } from "@/lib/india-locations";
import { BELT_RANKS } from "@/lib/constants";

interface RegisterStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    instructorDojoId?: string;
    instructorDojoName?: string;
}

interface Dojo {
    id: string;
    name: string;
    city: string;
    state: string;
}

const STEPS = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Details" },
    { id: 3, label: "Location" },
    { id: 4, label: "Voucher" },
];

export default function RegisterStudentModal({ isOpen, onClose, onSuccess, instructorDojoId, instructorDojoName }: RegisterStudentModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Voucher state
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState(false);
    const [voucherError, setVoucherError] = useState("");

    // Success state
    const [successData, setSuccessData] = useState<{ studentName: string; tempPassword: string; email: string } | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        countryCode: "+91",
        dob: "",
        height: "",
        weight: "",
        currentBeltRank: "White",
        beltExamDate: "",
        beltClaimReason: "",
        experienceYears: "0",
        experienceMonths: "0",
        fatherName: "",
        fatherPhone: "",
        state: "",
        city: "",
        dojoId: instructorDojoId || "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchDojos();
        }
    }, [isOpen]);

    const fetchDojos = async () => {
        try {
            const res = await api.get("/dojos");
            setDojos(res.data.data.dojos || []);
        } catch {
            // Silently handle — dojo selection will still work
        }
    };

    const handleValidateVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError("Please enter a voucher code");
            return;
        }
        setVoucherValidating(true);
        setVoucherError("");
        setVoucherValid(false);
        try {
            await api.post("/vouchers/validate", {
                code: voucherCode.trim(),
                type: "MEMBERSHIP",
            });
            setVoucherValid(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setVoucherError(error.response?.data?.message || "Invalid voucher code");
        } finally {
            setVoucherValidating(false);
        }
    };

    const handleSubmit = async () => {
        if (!voucherValid) {
            setVoucherError("Please verify a valid voucher code first");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await api.post("/vouchers/redeem/register-student", {
                ...formData,
                voucherCode: voucherCode.trim().toUpperCase(),
            });
            const { student, tempPassword } = res.data.data;
            setSuccessData({
                studentName: student.name,
                tempPassword,
                email: student.email,
            });
            showToast(`${student.name} registered successfully!`, "success");
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showToast(error.response?.data?.message || "Registration failed. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setFormData({
            name: "", email: "", phone: "", countryCode: "+91", dob: "",
            height: "", weight: "", currentBeltRank: "White", beltExamDate: "",
            beltClaimReason: "", experienceYears: "0", experienceMonths: "0",
            fatherName: "", fatherPhone: "", state: "", city: "",
            dojoId: instructorDojoId || "",
        });
        setVoucherCode("");
        setVoucherValid(false);
        setVoucherError("");
        setSuccessData(null);
        onClose();
    };

    const copyPassword = () => {
        if (successData?.tempPassword) {
            navigator.clipboard.writeText(successData.tempPassword);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    const canProceedStep1 = formData.name && formData.email && formData.phone;
    const canProceedStep2 = true; // Optional fields
    const canProceedStep3 = true; // Optional but dojo is pre-filled
    const canSubmitStep4 = voucherValid;

    const cities = formData.state ? (CITIES as Record<string, string[]>)[formData.state] || [] : [];

    if (!isOpen) return null;

    // Shared input styles
    const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all";
    const labelCls = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-orange-600/10 to-green-700/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-600 to-green-700 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Register Student</h2>
                                <p className="text-[11px] text-gray-400">Register a student on their behalf using a voucher</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stepper (hide on success) */}
                    {!successData && (
                        <div className="px-6 py-3 border-b border-white/5 flex-shrink-0">
                            <div className="flex items-center gap-1">
                                {STEPS.map((s, i) => (
                                    <div key={s.id} className="flex items-center flex-1">
                                        <div className={`flex items-center gap-1.5 ${step >= s.id ? 'text-orange-400' : 'text-gray-600'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                                                step > s.id ? 'bg-green-600 border-green-600 text-white' :
                                                step === s.id ? 'border-orange-500 text-orange-400' :
                                                'border-gray-700 text-gray-600'
                                            }`}>
                                                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : s.id}
                                            </div>
                                            <span className="text-[11px] font-bold hidden sm:inline">{s.label}</span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`flex-1 h-[2px] mx-2 rounded-full transition-colors ${step > s.id ? 'bg-green-600' : 'bg-white/10'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <AnimatePresence mode="wait">

                            {/* SUCCESS STATE */}
                            {successData && (
                                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Student Registered!</h3>
                                    <p className="text-gray-400 mb-6">{successData.studentName} has been registered successfully.</p>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-4 mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Login Email</p>
                                            <p className="text-white font-mono text-sm">{successData.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Temporary Password</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-mono text-sm flex-1">
                                                    {showPassword ? successData.tempPassword : '••••••••••'}
                                                </p>
                                                <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button onClick={copyPassword} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                                    {copiedPassword ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-white/5">
                                            <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                Share these credentials with the student. They should change their password after first login.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-green-700 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        Done
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 1: Basic Info */}
                            {!successData && step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <div>
                                        <label className={labelCls}>Full Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Student's full name"
                                                className={`${inputCls} pl-10`}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Email Address *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="student@email.com"
                                                className={`${inputCls} pl-10`}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Phone Number *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="9876543210"
                                                className={`${inputCls} pl-10`}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>Date of Birth</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="date"
                                                    value={formData.dob}
                                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                                    className={`${inputCls} pl-10`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Guardian Name</label>
                                            <input
                                                value={formData.fatherName}
                                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                                placeholder="Father/guardian name"
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Guardian Phone</label>
                                        <input
                                            value={formData.fatherPhone}
                                            onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                            placeholder="Guardian phone number"
                                            className={inputCls}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Belt & Physical Details */}
                            {!successData && step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <div>
                                        <label className={labelCls}>Current Belt Rank</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <select
                                                value={formData.currentBeltRank}
                                                onChange={(e) => setFormData({ ...formData, currentBeltRank: e.target.value })}
                                                className={`${inputCls} pl-10 appearance-none cursor-pointer`}
                                            >
                                                {BELT_RANKS.map(b => (
                                                    <option key={b} value={b} className="bg-zinc-900">{b}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {formData.currentBeltRank !== 'White' && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-3">
                                            <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Higher belt claims require verification. Student starts as White until approved.
                                            </p>
                                            <div>
                                                <label className={labelCls}>Belt Exam Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.beltExamDate}
                                                    onChange={(e) => setFormData({ ...formData, beltExamDate: e.target.value })}
                                                    className={inputCls}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Claim Reason</label>
                                                <input
                                                    value={formData.beltClaimReason}
                                                    onChange={(e) => setFormData({ ...formData, beltClaimReason: e.target.value })}
                                                    placeholder="e.g. Previously trained at XYZ dojo"
                                                    className={inputCls}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>Height (cm)</label>
                                            <div className="relative">
                                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="number"
                                                    value={formData.height}
                                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                                    placeholder="170"
                                                    className={`${inputCls} pl-10`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Weight (kg)</label>
                                            <div className="relative">
                                                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="number"
                                                    value={formData.weight}
                                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                    placeholder="65"
                                                    className={`${inputCls} pl-10`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>Experience (Years)</label>
                                            <input
                                                type="number"
                                                value={formData.experienceYears}
                                                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                                                min={0}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Experience (Months)</label>
                                            <input
                                                type="number"
                                                value={formData.experienceMonths}
                                                onChange={(e) => setFormData({ ...formData, experienceMonths: e.target.value })}
                                                min={0} max={11}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: Location & Dojo */}
                            {!successData && step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    {instructorDojoName && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                                            <p className="text-xs text-green-400 font-bold">Your dojo: {instructorDojoName}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Student will be auto-assigned to your dojo unless changed below.</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelCls}>State</label>
                                        <select
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                                            className={`${inputCls} appearance-none cursor-pointer`}
                                        >
                                            <option value="" className="bg-zinc-900">Select state...</option>
                                            {INDIAN_STATES.map(s => (
                                                <option key={s} value={s} className="bg-zinc-900">{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {formData.state && cities.length > 0 && (
                                        <div>
                                            <label className={labelCls}>City</label>
                                            <select
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className={`${inputCls} appearance-none cursor-pointer`}
                                            >
                                                <option value="" className="bg-zinc-900">Select city...</option>
                                                {cities.map((c: string) => (
                                                    <option key={c} value={c} className="bg-zinc-900">{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelCls}>Dojo</label>
                                        <select
                                            value={formData.dojoId}
                                            onChange={(e) => setFormData({ ...formData, dojoId: e.target.value })}
                                            className={`${inputCls} appearance-none cursor-pointer`}
                                        >
                                            <option value="" className="bg-zinc-900">
                                                {instructorDojoId ? 'Your dojo (default)' : 'Select a dojo...'}
                                            </option>
                                            {dojos.map(d => (
                                                <option key={d.id} value={d.id} className="bg-zinc-900">{d.name} — {d.city}</option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-gray-600 mt-1">Leave empty to use your assigned dojo</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: Voucher & Submit */}
                            {!successData && step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    {/* Summary */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Registration Summary</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-gray-400">Name</div>
                                            <div className="text-white font-semibold text-right">{formData.name}</div>
                                            <div className="text-gray-400">Email</div>
                                            <div className="text-white text-right truncate">{formData.email}</div>
                                            <div className="text-gray-400">Phone</div>
                                            <div className="text-white text-right">{formData.phone}</div>
                                            <div className="text-gray-400">Belt</div>
                                            <div className="text-white text-right">{formData.currentBeltRank}</div>
                                        </div>
                                    </div>

                                    {/* Voucher Input */}
                                    <div>
                                        <label className={labelCls}>Membership Voucher Code *</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    value={voucherCode}
                                                    onChange={(e) => {
                                                        setVoucherCode(e.target.value.toUpperCase());
                                                        setVoucherError("");
                                                        setVoucherValid(false);
                                                    }}
                                                    placeholder="KKFI-XXXXXXXX"
                                                    className={`${inputCls} pl-10 font-mono tracking-wider`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleValidateVoucher}
                                                disabled={voucherValidating || !voucherCode.trim()}
                                                className="px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex-shrink-0"
                                            >
                                                {voucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                            </button>
                                        </div>

                                        {voucherError && (
                                            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {voucherError}
                                            </div>
                                        )}

                                        {voucherValid && (
                                            <div className="mt-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-green-400">Voucher Valid!</p>
                                                    <p className="text-xs text-gray-400">Membership fee will be covered by this voucher.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                        <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            A temporary password will be generated. Share it with the student so they can log in and change it.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    {!successData && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02] flex-shrink-0">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                            ) : (
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={
                                        (step === 1 && !canProceedStep1) ||
                                        (step === 2 && !canProceedStep2) ||
                                        (step === 3 && !canProceedStep3)
                                    }
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-green-700 text-white text-sm font-bold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmitStep4 || isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-green-700 text-white text-sm font-bold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    {isSubmitting ? "Registering..." : "Register Student"}
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
