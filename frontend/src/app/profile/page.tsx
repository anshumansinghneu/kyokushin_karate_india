"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Edit2, Save, Shield, Loader2, MapPin, X, Award, AlertCircle, User, Mail, Phone, Ruler, Weight, ChevronRight, Lock, Clock, Building } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getUserProfileImage } from "@/lib/imageUtils";
import { searchCities, CityData } from "@/lib/india-locations";
import BeltCertificate from "@/components/BeltCertificate";
import { useToast } from "@/contexts/ToastContext";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } } };

function getBeltColor(belt?: string | null) {
    if (!belt) return { bg: "bg-white", border: "border-gray-300", text: "text-black", glow: "shadow-white/10", hex: "#ffffff" };
    const b = belt.toLowerCase();
    if (b.startsWith("black") || b.includes("dan")) return { bg: "bg-zinc-900", border: "border-zinc-600", text: "text-white", glow: "shadow-red-500/20", hex: "#18181b" };
    if (b === "brown") return { bg: "bg-amber-800", border: "border-amber-700", text: "text-white", glow: "shadow-amber-500/20", hex: "#92400e" };
    if (b === "green") return { bg: "bg-green-600", border: "border-green-500", text: "text-white", glow: "shadow-green-500/20", hex: "#16a34a" };
    if (b === "blue") return { bg: "bg-blue-600", border: "border-blue-500", text: "text-white", glow: "shadow-blue-500/20", hex: "#2563eb" };
    if (b === "yellow") return { bg: "bg-yellow-500", border: "border-yellow-400", text: "text-black", glow: "shadow-yellow-500/20", hex: "#eab308" };
    if (b === "orange") return { bg: "bg-orange-500", border: "border-orange-400", text: "text-white", glow: "shadow-orange-500/20", hex: "#f97316" };
    return { bg: "bg-white", border: "border-gray-300", text: "text-black", glow: "shadow-white/10", hex: "#ffffff" };
}

// Extracted as standalone component to prevent re-mount on parent re-renders
function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await api.post("/users/change-password", {
                currentPassword,
                newPassword,
            });
            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to change password.";
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
                <label htmlFor="cp-current" className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">Current Password</label>
                <Input
                    id="cp-current"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl"
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="cp-new" className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">New Password</label>
                <Input
                    id="cp-new"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl"
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="cp-confirm" className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">Confirm New Password</label>
                <Input
                    id="cp-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl"
                    disabled={loading}
                />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {success && <div className="text-emerald-400 text-sm">{success}</div>}
            <button type="submit" disabled={loading}
                className="w-full h-11 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
            </button>
        </form>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, checkAuth, updateProfile } = useAuthStore();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [beltHistory, setBeltHistory] = useState<any[]>([]);
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        countryCode: user?.countryCode || "+91",
        city: user?.city || "",
        state: user?.state || "",
        height: user?.height?.toString() || "",
        weight: user?.weight?.toString() || "",
    });

    // Check authentication
    useEffect(() => {
        if (!isAuthenticated) {
            checkAuth();
        }
    }, [isAuthenticated, checkAuth]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Update form data when user loads
    useEffect(() => {
        if (user) {
            // Strip country code prefix if phone was stored with it
            let phone = user.phone || "";
            if (phone.startsWith("+91")) phone = phone.slice(3);
            else if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);

            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone,
                countryCode: user.countryCode || "+91",
                city: user.city || "",
                state: user.state || "",
                height: user.height?.toString() || "",
                weight: user.weight?.toString() || "",
            });
            setCityQuery(user.city || "");
        }
    }, [user]);

    // Close city dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
                setShowCityDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Fetch belt history
    useEffect(() => {
        const fetchBeltHistory = async () => {
            if (!user?.id) return;
            try {
                const res = await api.get(`/belts/history/${user.id}`);
                setBeltHistory(res.data.data.history || []);
            } catch (error) {
                console.error("Failed to fetch belt history", error);
            }
        };
        fetchBeltHistory();
    }, [user]);

    const filteredCities = cityQuery.length >= 1
        ? searchCities(cityQuery, 20)
        : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            // Only allow digits, max 10
            const digits = value.replace(/\D/g, "").slice(0, 10);
            setFormData({ ...formData, phone: digits });
            if (digits.length > 0 && digits.length !== 10) {
                setPhoneError("Phone number must be 10 digits");
            } else {
                setPhoneError("");
            }
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleCitySelect = (city: CityData) => {
        setFormData({ ...formData, city: city.city, state: city.state });
        setCityQuery(city.city);
        setShowCityDropdown(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("File too large. Maximum size is 5MB.", "error");
            return;
        }
        if (!file.type.startsWith("image/")) {
            showToast("Please upload an image file (JPG, PNG, etc.)", "error");
            return;
        }
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append("image", file);
            const res = await api.post("/upload?folder=profiles", fd, {
                headers: { "Content-Type": undefined as any },
            });
            const imageUrl = res.data.url || res.data.data?.url;
            if (imageUrl) {
                await updateProfile({ profilePhotoUrl: imageUrl });
                showToast("Profile photo updated!", "success");
            } else {
                showToast("Upload succeeded but no URL returned", "error");
            }
        } catch (err: any) {
            console.error("Photo upload failed", err);
            const msg = err.response?.data?.message || "Failed to upload photo. Please try again.";
            showToast(msg, "error");
        } finally {
            setIsUploading(false);
            // Reset input so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        // Validate phone
        if (formData.phone && formData.phone.length !== 10) {
            setPhoneError("Phone number must be 10 digits");
            return;
        }
        setIsLoading(true);
        try {
            await updateProfile(formData);
            setIsEditing(false);
            showToast("Profile updated successfully!", "success");
        } catch (error) {
            console.error("Failed to update profile", error);
            showToast("Failed to update profile. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };


    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-[#060606] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-white/[0.06] animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-red-500 animate-spin" />
                    </div>
                    <p className="text-white/30 text-sm font-mono tracking-wider">LOADING PROFILE</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated || !user) {
        return null;
    }

    const belt = getBeltColor(user?.currentBeltRank);

    return (
        <div className="min-h-screen w-full bg-[#060606] text-white relative overflow-hidden">
            {/* Background grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
            {/* Subtle top glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

            <div className="container-responsive py-6 sm:py-10 relative z-10">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8 sm:mb-12"
                >
                    <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group py-2 min-h-[44px]">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                    <div className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]">
                        <span className="text-[10px] font-mono tracking-[0.2em] text-white/40 uppercase">Fighter Profile</span>
                    </div>
                </motion.header>

                {/* Hero Identity Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-8 sm:mb-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                >
                    {/* Background grid inside card */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    {/* Belt color accent stripe at top */}
                    <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${belt.hex}40, ${belt.hex}, ${belt.hex}40, transparent)` }} />

                    <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        {/* Avatar with belt-color ring */}
                        <div className="relative group flex-shrink-0">
                            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] ${belt.border} shadow-lg ${belt.glow}`}>
                                {getUserProfileImage(user) ? (
                                    <img src={getUserProfileImage(user)!} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                                        <User className="w-10 h-10 sm:w-12 sm:h-12 text-white/20" />
                                    </div>
                                )}
                            </div>
                            {/* Upload button */}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute -bottom-1 -right-1 p-2.5 rounded-full bg-[#111] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-center md:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">{user?.name}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${belt.bg} ${belt.text} ${belt.border} border`}>
                                    <Award className="w-3 h-3" />
                                    {user?.currentBeltRank || "White"} Belt
                                </span>
                                {user?.dojo?.name && (
                                    <span className="inline-flex items-center gap-1.5 text-sm text-white/40">
                                        <Building className="w-3.5 h-3.5" />
                                        {user.dojo.name}
                                    </span>
                                )}
                                {user?.membershipNumber && (
                                    <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] font-mono text-[11px] text-white/30 tracking-wider">
                                        {user.membershipNumber}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest font-mono ${
                            user?.membershipStatus === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : user?.membershipStatus === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                                user?.membershipStatus === 'ACTIVE' ? 'bg-emerald-400' :
                                user?.membershipStatus === 'PENDING' ? 'bg-amber-400' : 'bg-red-400'
                            }`} />
                            {user?.membershipStatus || "PENDING"}
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

                    {/* Left Column: Identity & Actions */}
                    <motion.div variants={fadeUp} className="lg:col-span-4 space-y-5">
                        {/* Quick Stats Card */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 space-y-5">
                            <h3 className="text-[11px] font-mono tracking-[0.2em] text-white/30 uppercase">Quick Info</h3>

                            <div className="space-y-4">
                                {[
                                    { label: "Membership ID", value: user?.membershipNumber || "Not Assigned", mono: true },
                                    { label: "Belt Rank", value: (user?.currentBeltRank || "White") + " Belt", accent: true },
                                    { label: "Dojo", value: user?.dojo?.name || "Not Assigned" },
                                    { label: "Status", value: user?.membershipStatus || "PENDING", status: true },
                                    { label: "Experience", value: (user?.experienceYears || user?.experienceMonths) ? `${user?.experienceYears || 0}y ${user?.experienceMonths || 0}m` : "Not Set" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                                        <span className="text-xs text-white/30 uppercase tracking-wider">{item.label}</span>
                                        <span className={`text-sm font-medium ${
                                            item.status
                                                ? user?.membershipStatus === 'ACTIVE' ? 'text-emerald-400' :
                                                  user?.membershipStatus === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                                                : item.accent ? 'text-red-400'
                                                : item.mono ? 'font-mono text-white/60 text-xs' : 'text-white/70'
                                        }`}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Belt Verification Status */}
                        {user?.verificationStatus && user.verificationStatus !== 'VERIFIED' && (
                            <div className={`p-4 rounded-xl border ${
                                user.verificationStatus === 'PENDING_VERIFICATION'
                                    ? 'bg-amber-500/[0.05] border-amber-500/10'
                                    : 'bg-red-500/[0.05] border-red-500/10'
                            }`}>
                                <div className="flex items-start gap-3">
                                    {user.verificationStatus === 'PENDING_VERIFICATION' ? (
                                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                        <p className={`text-sm font-semibold ${
                                            user.verificationStatus === 'PENDING_VERIFICATION' ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                            {user.verificationStatus === 'PENDING_VERIFICATION'
                                                ? 'Belt Verification Pending'
                                                : 'Belt Verification Rejected'}
                                        </p>
                                        <p className="text-xs text-white/30 mt-1 leading-relaxed">
                                            {user.verificationStatus === 'PENDING_VERIFICATION'
                                                ? 'Your belt rank claim is being reviewed by your instructor.'
                                                : 'Your belt rank claim was not approved. Contact your instructor.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Right Column: Details, Belt History, Password */}
                    <div className="lg:col-span-8 space-y-6 sm:space-y-8">

                        {/* Personal Details */}
                        <motion.div
                            variants={fadeUp}
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 lg:p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-red-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-white">Personal Details</h3>
                                </div>
                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                                        isEditing
                                            ? 'bg-white text-black hover:bg-white/90'
                                            : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    {isEditing ? (
                                        isLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving</> : <><Save className="w-3 h-3" /> Save</>
                                    ) : (
                                        <><Edit2 className="w-3 h-3" /> Edit</>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label htmlFor="profile-name" className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <User className="w-3 h-3" /> Full Name
                                    </label>
                                    <Input id="profile-name" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing}
                                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 transition-all h-11 rounded-xl" />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="profile-email" className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <Mail className="w-3 h-3" /> Email
                                    </label>
                                    <Input id="profile-email" name="email" value={formData.email} disabled
                                        className="bg-white/[0.03] border-white/[0.06] text-white/40 cursor-not-allowed h-11 rounded-xl" />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label htmlFor="profile-phone" className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <Phone className="w-3 h-3" /> Phone <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/40 text-sm font-mono min-w-[56px] justify-center h-11">
                                            +91
                                        </div>
                                        <Input id="profile-phone" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                                            placeholder="10-digit number" maxLength={10}
                                            className={`bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl flex-1 ${phoneError ? 'border-red-500/50' : ''}`} />
                                    </div>
                                    {phoneError && <p className="text-red-400 text-xs">{phoneError}</p>}
                                </div>

                                {/* City */}
                                <div className="space-y-2 relative" ref={cityDropdownRef}>
                                    <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <MapPin className="w-3 h-3" /> City
                                    </label>
                                    <div className="relative">
                                        <Input name="city" value={isEditing ? cityQuery : formData.city}
                                            onChange={(e) => { setCityQuery(e.target.value); setFormData({ ...formData, city: e.target.value, state: "" }); setShowCityDropdown(true); }}
                                            disabled={!isEditing} placeholder="Search city..." autoComplete="off"
                                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl" />
                                        {isEditing && cityQuery && (
                                            <button onClick={() => { setCityQuery(""); setFormData({ ...formData, city: "", state: "" }); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    {showCityDropdown && isEditing && filteredCities.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-[#111] border border-white/[0.08] shadow-2xl">
                                            {filteredCities.map((c) => (
                                                <button key={`${c.city}-${c.state}`} onClick={() => handleCitySelect(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/[0.05] text-sm text-white/70 flex justify-between items-center min-h-[44px] transition-colors">
                                                    <span>{c.city}</span>
                                                    <span className="text-white/20 text-xs">{c.state}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* State */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <MapPin className="w-3 h-3" /> State
                                    </label>
                                    <Input name="state" value={formData.state} onChange={handleChange} disabled={!isEditing} placeholder="Auto-filled from city"
                                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl" />
                                </div>

                                {/* Height */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <Ruler className="w-3 h-3" /> Height (cm)
                                    </label>
                                    <Input name="height" value={formData.height} onChange={handleChange} disabled={!isEditing}
                                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl" />
                                </div>

                                {/* Weight */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/25 uppercase">
                                        <Weight className="w-3 h-3" /> Weight (kg)
                                    </label>
                                    <Input name="weight" value={formData.weight} onChange={handleChange} disabled={!isEditing}
                                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-red-500/30 focus:ring-red-500/10 h-11 rounded-xl" />
                                </div>
                            </div>

                            {/* Mobile cancel when editing */}
                            <AnimatePresence>
                                {isEditing && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className="mt-5 pt-5 border-t border-white/[0.04] flex justify-end gap-3 md:hidden">
                                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm text-white/50 hover:text-white border border-white/[0.08] rounded-lg transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={handleSave} disabled={isLoading}
                                            className="px-5 py-2.5 text-sm font-semibold bg-white text-black rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            {isLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Belt History — Timeline */}
                        <motion.div
                            variants={fadeUp}
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 lg:p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <Award className="w-4 h-4 text-red-400" />
                                </div>
                                <h3 className="text-base font-semibold text-white">Belt Journey</h3>
                                {beltHistory.length > 0 && (
                                    <span className="ml-auto text-[11px] font-mono text-white/20">{beltHistory.length} promotion{beltHistory.length !== 1 && 's'}</span>
                                )}
                            </div>

                            {beltHistory.length > 0 ? (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06]" />

                                    <div className="space-y-1">
                                        {beltHistory.map((record, index) => {
                                            const bCol = getBeltColor(record.newBelt);
                                            return (
                                                <div key={index}>
                                                    <div className="relative flex items-start gap-4 py-4 group">
                                                        {/* Timeline dot */}
                                                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${bCol.bg} ${bCol.border} ${bCol.text} shadow-md ${bCol.glow} flex-shrink-0`}>
                                                            {record.newBelt?.[0] || 'W'}
                                                        </div>
                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 pt-1">
                                                            <div className="flex items-baseline justify-between gap-2">
                                                                <h4 className="font-semibold text-white text-sm">{record.newBelt} Belt</h4>
                                                                <span className="text-[11px] font-mono text-white/25 flex-shrink-0">
                                                                    {new Date(record.promotionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-white/30 mt-0.5">
                                                                {record.oldBelt && <span className="text-white/20">{record.oldBelt} → {record.newBelt}</span>}
                                                                {record.oldBelt && ' · '}
                                                                Promoted by {record.promotedBy?.name || 'Sensei'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Certificate download */}
                                                    <div className="ml-14 -mt-2 mb-2">
                                                        <BeltCertificate
                                                            studentName={user?.name || ''}
                                                            beltRank={record.newBelt}
                                                            promotionDate={record.promotionDate}
                                                            promoterName={record.promotedBy?.name || 'Sensei'}
                                                            membershipNumber={user?.membershipNumber}
                                                            dojoName={user?.dojo?.name}
                                                            oldBelt={record.oldBelt}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                                        <Award className="w-5 h-5 text-white/15" />
                                    </div>
                                    <p className="text-white/25 text-sm">No belt promotions recorded yet</p>
                                    <p className="text-white/15 text-xs">Your journey starts with the white belt</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Change Password */}
                        <motion.div
                            variants={fadeUp}
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 lg:p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-white/40" />
                                </div>
                                <h3 className="text-base font-semibold text-white">Change Password</h3>
                            </div>
                            <ChangePasswordForm />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
