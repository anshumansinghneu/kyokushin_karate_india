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

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, checkAuth, updateProfile } = useAuthStore();
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
        } catch (error) {
            console.error("Failed to update profile", error);
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

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />
            <div className="absolute inset-0 bg-[url('/dojo-bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />

            <div className="container mx-auto px-4 py-8 relative z-10">
                <header className="flex items-center justify-between mb-12">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold tracking-wider uppercase text-transparent stroke-text" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}>
                        My Profile
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
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
                                    className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-primary/80"
                                >
                                    <Camera className="w-4 h-4" />
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
                            className="glass-card p-8"
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
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="input-glass"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                    <Input
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="input-glass opacity-50 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Phone <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm font-mono min-w-[60px] justify-center">
                                            +91
                                        </div>
                                        <Input
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
                                                    className="w-full text-left px-4 py-2 hover:bg-primary/20 text-sm text-white flex justify-between items-center"
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
                            className="glass-card p-8"
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
                    </div>
                </div>
            </div>
        </div>
    );
}
