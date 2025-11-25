"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Edit2, Save, Shield } from "lucide-react";
import Link from "next/link";

// Mock data for belt history (replace with API call later)
const mockBeltHistory = [
    { belt: "White", date: "2023-01-15", promoter: "Sensei John" },
    { belt: "Orange", date: "2023-06-20", promoter: "Sensei John" },
    { belt: "Blue", date: "2023-12-10", promoter: "Shihan Mike" },
];

export default function ProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        city: user?.city || "",
        height: user?.height?.toString() || "",
        weight: user?.weight?.toString() || "",
    });

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
                                    {user?.profilePhotoUrl ? (
                                        <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-16 h-16 text-gray-600" />
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{formData.name}</h2>
                            <p className="text-primary font-bold tracking-wider uppercase text-sm mb-6">Blue Belt</p>

                            <div className="w-full grid grid-cols-2 gap-4 text-sm border-t border-white/10 pt-6">
                                <div>
                                    <p className="text-gray-500 uppercase text-xs font-bold">Membership ID</p>
                                    <p className="text-white font-mono">KKI-2024-MUM-001</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 uppercase text-xs font-bold">Dojo</p>
                                    <p className="text-white">Mumbai HQ</p>
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
                                {mockBeltHistory.map((record, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg
                                            ${record.belt === 'White' ? 'bg-white text-black border-gray-300' : ''}
                                            ${record.belt === 'Orange' ? 'bg-orange-500 text-white border-orange-600' : ''}
                                            ${record.belt === 'Blue' ? 'bg-blue-500 text-white border-blue-600' : ''}
                                        `}>
                                            {record.belt[0]}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white">{record.belt} Belt Promotion</h4>
                                            <p className="text-sm text-gray-400">Promoted by {record.promoter}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-mono text-primary">{record.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
