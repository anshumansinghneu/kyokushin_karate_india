"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Edit2, Trash2, X, Save, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from '@/contexts/ToastContext';

interface Dojo {
    id: string;
    name: string;
    dojoCode: string;
    city: string;
    state: string;
    address: string;
}

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const CITIES: Record<string, string[]> = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Navi Mumbai", "Kolhapur"],
    "Delhi": ["New Delhi", "Delhi", "Noida", "Gurgaon", "Ghaziabad", "Faridabad"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davangere", "Bellary"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Noida"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
    "Himachal Pradesh": ["Shimla", "Mandi", "Dharamshala", "Solan"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
    "Tripura": ["Agartala"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Arunachal Pradesh": ["Itanagar"],
    "Mizoram": ["Aizawl"],
    "Sikkim": ["Gangtok"],
    "Chandigarh": ["Chandigarh"],
    "Puducherry": ["Puducherry"],
    "Jammu and Kashmir": ["Srinagar", "Jammu"],
    "Ladakh": ["Leh", "Kargil"],
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Lakshadweep": ["Kavaratti"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"]
};


export default function DojoManager() {
    const { showToast } = useToast();
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDojo, setEditingDojo] = useState<Dojo | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        city: "",
        state: "",
        address: "",
        instructorId: ""
    });

    const [instructors, setInstructors] = useState<any[]>([]);

    const fetchDojos = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/dojos');
            setDojos(res.data.data.dojos);
        } catch (error) {
            console.error("Failed to fetch dojos", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInstructors = async () => {
        try {
            // Fetch both INSTRUCTOR and ADMIN roles
            const res = await api.get('/users?role=INSTRUCTOR,ADMIN');
            setInstructors(res.data.data.users);
        } catch (error) {
            console.error("Failed to fetch instructors", error);
        }
    };

    useEffect(() => {
        fetchDojos();
        fetchInstructors();
    }, []);

    const handleOpenModal = (dojo?: any) => {
        if (dojo) {
            setEditingDojo(dojo);
            setFormData({
                name: dojo.name,
                city: dojo.city,
                state: dojo.state || "",
                address: dojo.address || "",
                instructorId: dojo.instructors && dojo.instructors.length > 0 ? dojo.instructors[0].id : ""
            });
        } else {
            setEditingDojo(null);
            setFormData({
                name: "",
                city: "",
                state: "",
                address: "",
                instructorId: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDojo) {
                await api.patch(`/dojos/${editingDojo.id}`, formData);
            } else {
                await api.post('/dojos', { ...formData, country: 'India' });
            }
            setIsModalOpen(false);
            fetchDojos();
            showToast(editingDojo ? "Dojo updated successfully" : "Dojo created successfully", "success");
        } catch (error) {
            console.error("Failed to save dojo", error);
            showToast("Failed to save dojo. Please check the inputs.", "error");
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/dojos/${deleteId}`);
            fetchDojos();
            setDeleteId(null);
            showToast("Dojo deleted successfully", "success");
        } catch (error) {
            console.error("Failed to delete dojo", error);
            showToast("Failed to delete dojo", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Delete Dojo?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this Dojo? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Dojo'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Building className="text-primary" /> Dojo Management
                </h2>
                <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add New Dojo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dojos.map((dojo) => (
                    <motion.div
                        key={dojo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 relative group"
                    >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20" onClick={() => handleOpenModal(dojo)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20" onClick={() => handleDeleteClick(dojo.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{dojo.name}</h3>
                        <p className="text-sm text-primary font-mono mb-4">{dojo.dojoCode}</p>

                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {dojo.city}, {dojo.state}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingDojo ? 'Edit Dojo' : 'Create New Dojo'}
                                </h3>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Dojo Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Kyokushin Mumbai Central"
                                        required
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <select
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                                            required
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                        >
                                            <option value="" className="bg-zinc-900">Select State</option>
                                            {INDIAN_STATES.map((state) => (
                                                <option key={state} value={state} className="bg-zinc-900">{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <select
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            required
                                            disabled={!formData.state}
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                        >
                                            <option value="" className="bg-zinc-900">Select City</option>
                                            {formData.state && CITIES[formData.state]?.map((city) => (
                                                <option key={city} value={city} className="bg-zinc-900">{city}</option>
                                            ))}
                                            {formData.state && !CITIES[formData.state] && (
                                                <option value={formData.city} className="bg-zinc-900">Other</option>
                                            )}
                                        </select>
                                        {/* Fallback input if city not in list or state has no cities defined */}
                                        {formData.state && (!CITIES[formData.state] || CITIES[formData.state].length === 0) && (
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="Enter City"
                                                className="mt-2 bg-black/50 border-white/10"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full Address"
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Instructor <span className="text-red-500">*</span></Label>
                                    <select
                                        value={formData.instructorId}
                                        onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                        required
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                    >
                                        <option value="" className="bg-zinc-900">Select Instructor</option>
                                        {instructors.map((instructor) => (
                                            <option key={instructor.id} value={instructor.id} className="bg-zinc-900">
                                                {instructor.name} ({instructor.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                                        <Save className="w-4 h-4 mr-2" /> Save Dojo
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
