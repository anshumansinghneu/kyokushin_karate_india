"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, ChevronRight, User, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { INDIAN_STATES, CITIES, BELT_RANKS, COUNTRY_CODES } from "@/lib/constants";

const ADMIN_INSTRUCTOR_ID = "42b18481-85ee-49ed-8b3c-dc4f707fe29e"; // Sihan Vasant Kumar Singh

export default function RegisterPage() {
    const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        countryCode: "+91",
        dob: "",
        height: "",
        weight: "",
        country: "India",
        state: "",
        city: "",
        dojoId: "",
        currentBeltRank: "",
        instructorId: "",
        fatherName: "",
        fatherPhone: "",
        yearsOfExperience: ""
    });

    const [locations, setLocations] = useState<any>(null);
    const [dojos, setDojos] = useState<any[]>([]);
    const [selectedDojo, setSelectedDojo] = useState<any>(null);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [loadingDojos, setLoadingDojos] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [age, setAge] = useState<number | null>(null); // Derived age state

    const { register, isLoading, error: authError } = useAuthStore();
    const router = useRouter();

    // Fetch Locations on Mount
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await api.get('/dojos/locations');
                setLocations(res.data.data.locations);
            } catch (err) {
                console.error("Failed to fetch locations", err);
            } finally {
                setLoadingLocations(false);
            }
        };
        fetchLocations();
    }, []);

    // Fetch Dojos when City changes
    useEffect(() => {
        const fetchDojos = async () => {
            if (!formData.city || !formData.state || !formData.country) return;

            setLoadingDojos(true);
            try {
                const query = `?country=${formData.country}&state=${formData.state}&city=${formData.city}`;
                const res = await api.get(`/dojos${query}`);
                setDojos(res.data.data.dojos);
            } catch (err) {
                console.error("Failed to fetch dojos", err);
            } finally {
                setLoadingDojos(false);
            }
        };

        if (formData.city) {
            fetchDojos();
        } else {
            setDojos([]);
        }
    }, [formData.city, formData.state, formData.country]);

    // Update Instructor Logic
    useEffect(() => {
        if (formData.dojoId) {
            if (formData.dojoId === "fallback") {
                setSelectedDojo({ name: "Direct Student", instructors: [{ name: "Sihan Vasant Kumar Singh" }] });
                setFormData(prev => ({ ...prev, instructorId: ADMIN_INSTRUCTOR_ID }));
            } else {
                const dojo = dojos.find(d => d.id === formData.dojoId);
                setSelectedDojo(dojo);
                if (dojo && dojo.instructors && dojo.instructors.length > 0) {
                    setFormData(prev => ({ ...prev, instructorId: dojo.instructors[0].id }));
                }
            }
        } else {
            setSelectedDojo(null);
            setFormData(prev => ({ ...prev, instructorId: "" }));
        }
    }, [formData.dojoId, dojos]);

    // Calculate Age when DOB changes
    useEffect(() => {
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            setAge(calculatedAge);
        } else {
            setAge(null);
        }
    }, [formData.dob]);

    const validateField = (name: string, value: string) => {
        let error = "";
        switch (name) {
            case "name":
                if (!value.trim()) error = "Full Name is required";
                else if (value.length < 3) error = "Name must be at least 3 characters";
                break;
            case "email":
                if (!value) error = "Email is required";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email address";
                break;
            case "phone":
                if (!value) error = "Phone number is required";
                else if (!/^[\d\s-]{10,}$/.test(value)) error = "Invalid phone number";
                break;
            case "password":
                if (!value) error = "Password is required";
                else if (value.length < 8) error = "Password must be at least 8 characters";
                break;
            case "confirmPassword":
                if (value !== formData.password) error = "Passwords do not match";
                break;
            case "dob":
                if (!value) error = "Date of Birth is required";
                else {
                    const age = new Date().getFullYear() - new Date(value).getFullYear();
                    if (age < 4) error = "Must be at least 4 years old";
                }
                break;
            case "height":
                if (!value) error = "Height is required";
                else if (isNaN(Number(value)) || Number(value) < 50 || Number(value) > 250) error = "Invalid height (50-250 cm)";
                break;
            case "weight":
                if (!value) error = "Weight is required";
                else if (isNaN(Number(value)) || Number(value) < 20 || Number(value) > 200) error = "Invalid weight (20-200 kg)";
                break;
            case "currentBeltRank":
                if (!value) error = "Please select your current belt";
                break;
            case "state":
                if (!value) error = "State is required";
                break;
            case "city":
                if (!value) error = "City is required";
                break;
            case "dojoId":
                if (role === "STUDENT" && !value) error = "Please select a Dojo";
                break;
            case "fatherName":
                if (role === "STUDENT" && !value) error = "Father's Name is required";
                break;
            case "fatherPhone":
                if (role === "STUDENT" && !value) error = "Father's Phone is required";
                else if (value && !/^[\d\s-]{10,}$/.test(value)) error = "Invalid phone number";
                break;
            case "yearsOfExperience":
                if (role === "INSTRUCTOR" && !value) error = "Years of Experience is required";
                else if (value && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 50)) error = "Invalid years (0-50)";
                break;
        }
        return error;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear dependent fields
        if (name === 'country') setFormData(prev => ({ ...prev, state: "", city: "", dojoId: "" }));
        if (name === 'state') setFormData(prev => ({ ...prev, city: "", dojoId: "" }));
        if (name === 'city') setFormData(prev => ({ ...prev, dojoId: "" }));

        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields based on role
        const newErrors: Record<string, string> = {};
        const fieldsToValidate = role === "STUDENT" 
            ? ["name", "email", "password", "confirmPassword", "phone", "dob", "height", "weight", "state", "city", "currentBeltRank", "dojoId", "fatherName", "fatherPhone"]
            : ["name", "email", "password", "confirmPassword", "phone", "dob", "height", "weight", "state", "city", "currentBeltRank", "yearsOfExperience"];

        fieldsToValidate.forEach(key => {
            const error = validateField(key, formData[key as keyof typeof formData]);
            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        setTouched(fieldsToValidate.reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (Object.keys(newErrors).length > 0) return;

        try {
            const payload: any = {
                ...formData,
                role,
                height: Number(formData.height),
                weight: Number(formData.weight)
            };

            // Add instructor-specific fields
            if (role === "INSTRUCTOR") {
                payload.yearsOfExperience = Number(formData.yearsOfExperience);
                // Remove student-specific fields
                delete payload.fatherName;
                delete payload.fatherPhone;
                if (!formData.dojoId) delete payload.dojoId; // Dojo optional for instructors
            } else {
                // Remove instructor-specific fields for students
                delete payload.yearsOfExperience;
            }

            await register(payload);
            router.push("/dashboard");
        } catch (err) {
            // Error handled by store
        }
    };

    // Get available cities based on selected state
    const availableCities = formData.state ? CITIES[formData.state] || [] : [];

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-black text-white font-sans selection:bg-red-900 selection:text-white">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black z-0" />
            <div className="absolute inset-0 bg-[url('/training-bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay z-0" />

            {/* Left Side - Brand & Vision */}
            <div className="hidden lg:flex w-5/12 relative flex-col justify-between p-12 z-10 border-r border-white/5 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover:scale-110 transition-transform">K</div>
                        <span className="text-2xl font-black tracking-tighter">KYOKUSHIN</span>
                    </Link>
                </motion.div>

                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-7xl font-black leading-none tracking-tighter mb-6">
                            FORGE<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">YOUR</span><br />
                            LEGACY
                        </h1>
                        <p className="text-xl text-gray-400 max-w-md leading-relaxed">
                            Join the elite ranks of Kyokushin Karate. Discipline, strength, and spirit await those who dare to begin.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex gap-4"
                    >
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-red-600"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '0%' }}
                                    transition={{ duration: 1.5, delay: 0.5 + (i * 0.2), repeat: Infinity, repeatDelay: 3 }}
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="text-xs text-gray-600 uppercase tracking-widest">
                    © 2024 Kyokushin India
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full lg:w-7/12 flex flex-col relative z-20 overflow-y-auto h-screen scrollbar-hide">
                <div className="min-h-full flex flex-col justify-center p-6 md:p-12 lg:p-20">
                    <div className="max-w-xl w-full mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="lg:hidden flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Link>
                            <div className="text-right ml-auto">
                                <p className="text-sm text-gray-400">Already a member?</p>
                                <Link href="/login" className="text-red-500 font-bold hover:text-red-400 transition-colors">Sign In</Link>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">Create Account</h2>
                            <p className="text-gray-400 mb-8">Enter your details to apply for membership.</p>

                            {authError && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {authError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role Selection Toggle */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Register As *</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setRole("STUDENT")}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                role === "STUDENT" 
                                                    ? "border-primary bg-primary/10 text-white" 
                                                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                                            }`}
                                        >
                                            <User className="w-6 h-6 mx-auto mb-2" />
                                            <p className="font-bold">Student</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole("INSTRUCTOR")}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                role === "INSTRUCTOR" 
                                                    ? "border-primary bg-primary/10 text-white" 
                                                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                                            }`}
                                        >
                                            <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                                            <p className="font-bold">Instructor</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Personal Details Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-white/10 pb-2">Personal Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Full Name <span className="text-red-500">*</span></label>
                                            <Input
                                                name="name"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.name ? 'border-red-500' : ''}`}
                                            />
                                            {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Phone <span className="text-red-500">*</span></label>
                                            <Input
                                                name="phone"
                                                placeholder="+91 98765 43210"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.phone ? 'border-red-500' : ''}`}
                                            />
                                            {errors.phone && <p className="text-xs text-red-500 ml-1">{errors.phone}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-400 ml-1">Email Address <span className="text-red-500">*</span></label>
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="osu@kyokushin.in"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                        {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Date of Birth <span className="text-red-500">*</span></label>
                                            <Input
                                                name="dob"
                                                type="date"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.dob ? 'border-red-500' : ''}`}
                                            />
                                            {errors.dob && <p className="text-xs text-red-500 ml-1">{errors.dob}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Age</label>
                                            <div className="h-11 flex items-center px-3 rounded-md border border-white/10 bg-white/5 text-gray-400">
                                                {age !== null ? `${age} years` : "-"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Current Belt <span className="text-red-500">*</span></label>
                                            <select
                                                name="currentBeltRank"
                                                value={formData.currentBeltRank}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`w-full h-11 rounded-md border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors ${errors.currentBeltRank ? 'border-red-500' : 'border-white/10 focus:border-red-500/50'}`}
                                            >
                                                <option value="" className="bg-black">Select Belt</option>
                                                {BELT_RANKS.map(belt => (
                                                    <option key={belt} value={belt} className="bg-black">{belt}</option>
                                                ))}
                                            </select>
                                            {errors.currentBeltRank && <p className="text-xs text-red-500 ml-1">{errors.currentBeltRank}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Height (cm) <span className="text-red-500">*</span></label>
                                            <Input
                                                name="height"
                                                type="number"
                                                placeholder="175"
                                                value={formData.height}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.height ? 'border-red-500' : ''}`}
                                            />
                                            {errors.height && <p className="text-xs text-red-500 ml-1">{errors.height}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Weight (kg) <span className="text-red-500">*</span></label>
                                            <Input
                                                name="weight"
                                                type="number"
                                                placeholder="70"
                                                value={formData.weight}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.weight ? 'border-red-500' : ''}`}
                                            />
                                            {errors.weight && <p className="text-xs text-red-500 ml-1">{errors.weight}</p>}
                                        </div>
                                        {role === "INSTRUCTOR" && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-400 ml-1">Years of Experience <span className="text-red-500">*</span></label>
                                                <Input
                                                    name="yearsOfExperience"
                                                    type="number"
                                                    placeholder="5"
                                                    value={formData.yearsOfExperience}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.yearsOfExperience ? 'border-red-500' : ''}`}
                                                />
                                                {errors.yearsOfExperience && <p className="text-xs text-red-500 ml-1">{errors.yearsOfExperience}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Guardian Details - Only for Students */}
                                    {role === "STUDENT" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-400 ml-1">Father's Name <span className="text-red-500">*</span></label>
                                                <Input
                                                    name="fatherName"
                                                    placeholder="Father's Full Name"
                                                    value={formData.fatherName}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.fatherName ? 'border-red-500' : ''}`}
                                                />
                                                {errors.fatherName && <p className="text-xs text-red-500 ml-1">{errors.fatherName}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-400 ml-1">Father's Phone <span className="text-red-500">*</span></label>
                                                <div className="flex gap-2">
                                                    <select
                                                        name="countryCode"
                                                        value={formData.countryCode}
                                                        onChange={handleChange}
                                                        className="w-24 h-11 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                    >
                                                        {COUNTRY_CODES.map(c => (
                                                            <option key={c.code} value={c.code} className="bg-black">{c.flag} {c.code}</option>
                                                        ))}
                                                    </select>
                                                    <Input
                                                        name="fatherPhone"
                                                        placeholder="9876543210"
                                                        value={formData.fatherPhone}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        className={`flex-1 bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.fatherPhone ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {errors.fatherPhone && <p className="text-xs text-red-500 ml-1">{errors.fatherPhone}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dojo Selection Section */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-white/10 pb-2">Dojo Selection</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">State <span className="text-red-500">*</span></label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`w-full h-11 rounded-md border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors ${errors.state ? 'border-red-500' : 'border-white/10 focus:border-red-500/50'}`}
                                            >
                                                <option value="" className="bg-black">Select State</option>
                                                {INDIAN_STATES.map(s => (
                                                    <option key={s} value={s} className="bg-black">{s}</option>
                                                ))}
                                            </select>
                                            {errors.state && <p className="text-xs text-red-500 ml-1">{errors.state}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">City <span className="text-red-500">*</span></label>
                                            <select
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={!formData.state}
                                                className={`w-full h-11 rounded-md border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors disabled:opacity-50 ${errors.city ? 'border-red-500' : 'border-white/10 focus:border-red-500/50'}`}
                                            >
                                                <option value="" className="bg-black">Select City</option>
                                                {availableCities.map((c: string) => (
                                                    <option key={c} value={c} className="bg-black">{c}</option>
                                                ))}
                                            </select>
                                            {errors.city && <p className="text-xs text-red-500 ml-1">{errors.city}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-400 ml-1">
                                            Dojo {role === "STUDENT" && <span className="text-red-500">*</span>}
                                            {role === "INSTRUCTOR" && <span className="text-gray-500 text-xs">(Optional)</span>}
                                        </label>
                                        <select
                                            name="dojoId"
                                            value={formData.dojoId}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            disabled={!formData.city || loadingDojos}
                                            className={`w-full h-11 rounded-md border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors disabled:opacity-50 ${errors.dojoId ? 'border-red-500' : 'border-white/10 focus:border-red-500/50'}`}
                                        >
                                            <option value="" className="bg-black">{loadingDojos ? "Loading Dojos..." : "Select Dojo"}</option>
                                            {dojos.map(d => (
                                                <option key={d.id} value={d.id} className="bg-black">{d.name} ({d.dojoCode})</option>
                                            ))}
                                            {formData.city && (
                                                <option value="fallback" className="bg-black text-yellow-500 font-bold">
                                                    No Dojo Found? Register with Sihan Vasant Kumar Singh
                                                </option>
                                            )}
                                        </select>
                                        {errors.dojoId && <p className="text-xs text-red-500 ml-1">{errors.dojoId}</p>}
                                    </div>

                                    {/* Instructor Display */}
                                    <AnimatePresence>
                                        {selectedDojo && selectedDojo.instructors && selectedDojo.instructors.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-4"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                                                    {selectedDojo.instructors[0].name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Assigned Instructor</p>
                                                    <p className="text-sm font-bold text-white">{selectedDojo.instructors[0].name}</p>
                                                </div>
                                                <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Security Section */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-white/10 pb-2">Security</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Password <span className="text-red-500">*</span></label>
                                            <Input
                                                name="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.password ? 'border-red-500' : ''}`}
                                            />
                                            {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 ml-1">Confirm Password <span className="text-red-500">*</span></label>
                                            <Input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 h-11 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                            />
                                            {errors.confirmPassword && <p className="text-xs text-red-500 ml-1">{errors.confirmPassword}</p>}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 mt-8 text-lg font-bold bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/20 rounded-xl"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Complete Registration <ChevronRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
