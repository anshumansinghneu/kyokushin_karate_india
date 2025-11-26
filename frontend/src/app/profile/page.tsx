"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Edit2, Save, Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getUserProfileImage } from "@/lib/imageUtils";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, checkAuth, updateProfile } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [beltHistory, setBeltHistory] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        city: user?.city || "",
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
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                city: user.city || "",
                height: user.height?.toString() || "",
                weight: user.weight?.toString() || "",
            });
        }
    }, [user]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateProfile(formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            // Ideally show a toast notification here
        } finally {
            setIsLoading(false);
        }
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
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">{
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
                                    {getUserProfileImage(user) ? (
                                        <img src={getUserProfileImage(user)!} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-16 h-16 text-gray-600" />
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone</label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="input-glass"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">City</label>
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={!isEditing}
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
                                        <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
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
