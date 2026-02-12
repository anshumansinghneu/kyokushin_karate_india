"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Edit2, Save, Shield, Loader2, MapPin, X, Download, Award } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getUserProfileImage } from "@/lib/imageUtils";
import { INDIAN_CITIES, CityData } from "@/lib/indianCities";
import BeltCertificate from "@/components/BeltCertificate";
import { useToast } from "@/contexts/ToastContext";

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
                setBeltHistory(res.data.data.beltHistory || []);
            } catch (error) {
                console.error("Failed to fetch belt history", error);
            }
        };
        fetchBeltHistory();
    }, [user]);

    const filteredCities = cityQuery.length >= 1
        ? INDIAN_CITIES.filter((c) =>
              c.city.toLowerCase().startsWith(cityQuery.toLowerCase())
          ).slice(0, 20)
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
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.post("/upload?folder=profiles", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const imageUrl = res.data.url || res.data.data?.url;
            if (imageUrl) {
                await api.patch("/users/updateMe", { profilePhotoUrl: imageUrl });
                await checkAuth();
            }
        } catch (err) {
            console.error("Photo upload failed", err);
            showToast("Failed to upload photo. Please try again.", "error");
        } finally {
            setIsUploading(false);
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

    const handleDownloadCard = async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });

        // Card background
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, 86, 54, "F");

        // Red accent top bar
        doc.setFillColor(220, 38, 38);
        doc.rect(0, 0, 86, 1.5, "F");

        // Org name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("KYOKUSHIN KARATE", 5, 7);
        doc.setFontSize(4.5);
        doc.setTextColor(220, 38, 38);
        doc.text("FOUNDATION OF INDIA", 5, 10);

        // Membership ID top right
        doc.setFontSize(4);
        doc.setTextColor(150, 150, 150);
        doc.text("MEMBERSHIP ID", 81, 6, { align: "right" });
        doc.setFontSize(5.5);
        doc.setTextColor(220, 38, 38);
        doc.text(user?.membershipNumber || "PENDING", 81, 9.5, { align: "right" });

        // Divider
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.2);
        doc.line(5, 13, 81, 13);

        // Member name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text((user?.name || "Member").toUpperCase(), 5, 20);

        // Info fields
        const fields = [
            { label: "RANK", value: user?.currentBeltRank || "White Belt" },
            { label: "DOJO", value: user?.dojo?.name || "Main Dojo" },
            { label: "STATUS", value: user?.membershipStatus || "PENDING" },
        ];

        let xPos = 5;
        fields.forEach((f) => {
            doc.setFontSize(3.5);
            doc.setTextColor(120, 120, 120);
            doc.text(f.label, xPos, 26);
            doc.setFontSize(5);
            doc.setTextColor(255, 255, 255);
            doc.text(f.value, xPos, 29.5);
            xPos += 26;
        });

        // Bottom bar
        doc.setFillColor(25, 25, 25);
        doc.rect(0, 44, 86, 10, "F");
        doc.setDrawColor(50, 50, 50);
        doc.line(0, 44, 86, 44);

        // Status dot + text
        const statusColor = user?.membershipStatus === "ACTIVE" ? [34, 197, 94] : user?.membershipStatus === "PENDING" ? [234, 179, 8] : [239, 68, 68];
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.circle(7, 49.5, 1, "F");
        doc.setFontSize(3.5);
        doc.setTextColor(180, 180, 180);
        doc.text(`STATUS: ${user?.membershipStatus || "PENDING"}`, 10, 50);

        // Website
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(3);
        doc.text("kyokushin-karate-india.vercel.app", 81, 50, { align: "right" });

        // Indian flag stripe at very bottom
        doc.setFillColor(255, 153, 51);
        doc.rect(0, 53, 28.67, 1, "F");
        doc.setFillColor(255, 255, 255);
        doc.rect(28.67, 53, 28.67, 1, "F");
        doc.setFillColor(19, 136, 8);
        doc.rect(57.34, 53, 28.66, 1, "F");

        doc.save(`KKFI_Card_${user?.membershipNumber || "member"}.pdf`);
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated || !user) {
        return null;
    }

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
                <div>
                    <label htmlFor="cp-current" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Current Password</label>
                    <Input
                        id="cp-current"
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className="input-glass"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="cp-new" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">New Password</label>
                    <Input
                        id="cp-new"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="input-glass"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="cp-confirm" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                    <Input
                        id="cp-confirm"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="input-glass"
                        disabled={loading}
                    />
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                {success && <div className="text-green-400 text-sm">{success}</div>}
                <Button type="submit" className="w-full h-10 bg-primary text-white font-bold rounded-lg" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
                </Button>
            </form>
        );
    }

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />
            <div className="absolute inset-0 bg-[url('/dojo-bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />

            <div className="container mx-auto px-4 py-8 relative z-10">
                <header className="flex items-center justify-between mb-6 sm:mb-12">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group py-2 min-h-[44px]">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-wider uppercase text-transparent stroke-text" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}>
                        My Profile
                    </h1>
                </header>

                {/* Hero Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-8 rounded-2xl overflow-hidden border border-white/5"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/60 via-zinc-900/80 to-black" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px]" />
                    {/* Belt color stripe */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                        user?.currentBeltRank === 'Black' ? 'bg-gradient-to-r from-black via-red-600 to-black' :
                        user?.currentBeltRank === 'Brown' ? 'bg-amber-700' :
                        user?.currentBeltRank === 'Green' ? 'bg-green-500' :
                        user?.currentBeltRank === 'Blue' ? 'bg-blue-500' :
                        user?.currentBeltRank === 'Yellow' ? 'bg-yellow-500' :
                        user?.currentBeltRank === 'Orange' ? 'bg-orange-500' :
                        'bg-white/30'
                    }`} />
                    <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-20 h-20 rounded-full border-2 border-red-500/40 overflow-hidden bg-black/50 flex items-center justify-center flex-shrink-0">
                            {getUserProfileImage(user) ? (
                                <img src={getUserProfileImage(user)!} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-10 h-10 text-gray-600" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user?.name}</h2>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-red-500" />
                                    {user?.currentBeltRank || "White"} Belt
                                </span>
                                {user?.dojo?.name && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-red-500" />
                                        {user.dojo.name}
                                    </span>
                                )}
                                {user?.membershipNumber && (
                                    <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-xs text-gray-500">
                                        #{user.membershipNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            user?.membershipStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            user?.membershipStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                            {user?.membershipStatus || "PENDING"}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="glass-card p-4 sm:p-6 lg:p-8 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent" />

                            <div className="relative mb-6 group">
                                <div className="w-32 h-32 rounded-full border-4 border-primary/30 overflow-hidden bg-black/50 flex items-center justify-center">
                                    {isUploading ? (
                                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    ) : getUserProfileImage(user) ? (
                                        <img src={getUserProfileImage(user)!} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-16 h-16 text-gray-600" />
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-3 bg-primary rounded-full text-white shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-primary/80 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{formData.name}</h2>
                            <p className="text-primary font-bold tracking-wider uppercase text-sm mb-6">{user?.currentBeltRank || "White"} Belt</p>

                            <div className="w-full space-y-4 text-sm border-t border-white/10 pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500 uppercase text-xs font-bold">Membership ID</p>
                                        <p className="text-white font-mono">{user?.membershipNumber || "Not Assigned"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase text-xs font-bold">Status</p>
                                        <p className={`font-bold ${
                                            user?.membershipStatus === 'ACTIVE' ? 'text-green-400' :
                                            user?.membershipStatus === 'PENDING' ? 'text-yellow-400' :
                                            user?.membershipStatus === 'EXPIRED' ? 'text-red-400' :
                                            'text-gray-400'
                                        }`}>{user?.membershipStatus || "PENDING"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 uppercase text-xs font-bold">Dojo</p>
                                    <p className="text-white">{user?.dojo?.name || "Not Assigned"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Download Membership Card */}
                        <Button
                            onClick={handleDownloadCard}
                            className="w-full mt-4 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Membership Card
                        </Button>
                    </motion.div>

                    {/* Right Column: Details & History */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-4 sm:p-6 lg:p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary rounded-full" />
                                    Personal Details
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className="text-primary hover:text-primary-light hover:bg-primary/10"
                                >
                                    {isEditing ? (
                                        isLoading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                                    ) : (
                                        <><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</>
                                    )}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="profile-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <Input
                                        id="profile-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="input-glass"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="profile-email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                    <Input
                                        id="profile-email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="input-glass opacity-50 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="profile-phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Phone <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm font-mono min-w-[60px] justify-center">
                                            +91
                                        </div>
                                        <Input
                                            id="profile-phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="10-digit number"
                                            maxLength={10}
                                            className={`input-glass flex-1 ${phoneError ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                                </div>
                                <div className="space-y-2 relative" ref={cityDropdownRef}>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        <MapPin className="w-3 h-3 inline mr-1" />City
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="city"
                                            value={isEditing ? cityQuery : formData.city}
                                            onChange={(e) => {
                                                setCityQuery(e.target.value);
                                                setFormData({ ...formData, city: e.target.value, state: "" });
                                                setShowCityDropdown(true);
                                            }}
                                            disabled={!isEditing}
                                            placeholder="Search city..."
                                            className="input-glass"
                                            autoComplete="off"
                                        />
                                        {isEditing && cityQuery && (
                                            <button
                                                onClick={() => {
                                                    setCityQuery("");
                                                    setFormData({ ...formData, city: "", state: "" });
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    {showCityDropdown && isEditing && filteredCities.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-gray-900 border border-white/10 shadow-xl">
                                            {filteredCities.map((c) => (
                                                <button
                                                    key={`${c.city}-${c.state}`}
                                                    onClick={() => handleCitySelect(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-primary/20 text-sm text-white flex justify-between items-center min-h-[44px]"
                                                >
                                                    <span>{c.city}</span>
                                                    <span className="text-gray-500 text-xs">{c.state}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">State</label>
                                    <Input
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="Auto-filled from city"
                                        className="input-glass"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Height (cm)</label>
                                    <Input
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="input-glass"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Weight (kg)</label>
                                    <Input
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="input-glass"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Belt History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-4 sm:p-6 lg:p-8"
                        >
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                <span className="w-1 h-6 bg-primary rounded-full" />
                                Belt History
                            </h3>

                            <div className="space-y-4">
                                {beltHistory.length > 0 ? (
                                    beltHistory.map((record, index) => (
                                        <div key={index}>
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg
                                                    ${record.newBelt === 'White' ? 'bg-white text-black border-gray-300' : ''}
                                                    ${record.newBelt === 'Orange' ? 'bg-orange-500 text-white border-orange-600' : ''}
                                                    ${record.newBelt === 'Blue' ? 'bg-blue-500 text-white border-blue-600' : ''}
                                                    ${record.newBelt === 'Yellow' ? 'bg-yellow-500 text-white border-yellow-600' : ''}
                                                    ${record.newBelt === 'Green' ? 'bg-green-500 text-white border-green-600' : ''}
                                                    ${record.newBelt === 'Brown' ? 'bg-amber-700 text-white border-amber-800' : ''}
                                                    ${record.newBelt === 'Black' ? 'bg-black text-white border-gray-600' : ''}
                                                `}>
                                                    {record.newBelt?.[0] || 'W'}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white">{record.newBelt} Belt Promotion</h4>
                                                    <p className="text-sm text-gray-400">Promoted by {record.promotedBy?.name || 'Sensei'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-mono text-primary">{new Date(record.promotionDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {/* Belt Certificate Download */}
                                            <div className="mt-2">
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
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No belt promotions yet</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Change Password Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="glass-card p-4 sm:p-6 lg:p-8"
                        >
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                <span className="w-1 h-6 bg-primary rounded-full" />
                                Change Password
                            </h3>
                            <ChangePasswordForm />
                        </motion.div>

                    </div>
                </div>
            </div>

            {/* Mobile Sticky Save Bar */}
            {isEditing && (
                <div className="fixed bottom-16 left-0 right-0 z-50 p-3 bg-black/95 backdrop-blur-xl border-t border-white/10 md:hidden safe-area-inset">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 h-12 border-white/20 text-white font-bold rounded-xl active:scale-95"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
