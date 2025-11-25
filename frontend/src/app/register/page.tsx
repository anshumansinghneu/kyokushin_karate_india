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
        <div className="min-h-screen w-full flex relative overflow-hidden bg-black text-white font-sans selection:bg-red-500/30">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-black z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] group-hover:scale-110 transition-transform duration-500">K</div>
                        <span className="text-3xl font-black tracking-tighter text-white">KYOKUSHIN</span>
                    </Link>
                </motion.div>

                <div className="space-y-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-8xl font-black leading-[0.9] tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                            FORGE<br />
                            <span className="text-red-600">YOUR</span><br />
                            LEGACY
                        </h1>
                        <p className="text-2xl text-zinc-400 max-w-lg leading-relaxed font-light">
                            Join the elite ranks. Discipline, strength, and spirit await those who dare to begin.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex gap-4"
                    >
                        <div className="h-1 w-24 bg-gradient-to-r from-red-600 to-transparent rounded-full" />
                    </motion.div>
                </div>

                <div className="flex justify-between items-end text-xs text-zinc-600 uppercase tracking-widest font-medium">
                    <span>© 2024 Kyokushin India</span>
                    <span>Osu!</span>
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-1/2 flex flex-col relative z-20 h-screen overflow-y-auto scrollbar-hide">
                <div className="min-h-full flex flex-col justify-start p-4 md:p-8 lg:p-12 py-8">
                    <div className="max-w-2xl w-full mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="hidden sm:inline">Back</span>
                            </Link>
                            <div className="text-right">
                                <p className="text-xs text-zinc-500">Already a member?</p>
                                <Link href="/login" className="text-red-500 font-bold text-sm hover:text-red-400 transition-colors">Sign In</Link>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl"
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Join the Dojo</h2>
                                <p className="text-sm text-zinc-400">Begin your martial arts journey</p>
                            </div>

                            {authError && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {authError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role Selection Toggle */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">I am a</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRole("STUDENT")}
                                            className={`p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-2 ${role === "STUDENT"
                                                    ? "border-red-500 bg-red-500/10 text-white"
                                                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                                                }`}
                                        >
                                            <User className={`w-5 h-5 ${role === "STUDENT" ? "text-red-500" : ""}`} />
                                            <span className="font-bold text-sm">Student</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole("INSTRUCTOR")}
                                            className={`p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-2 ${role === "INSTRUCTOR"
                                                    ? "border-red-500 bg-red-500/10 text-white"
                                                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                                                }`}
                                        >
                                            <GraduationCap className={`w-5 h-5 ${role === "INSTRUCTOR" ? "text-red-500" : ""}`} />
                                            <span className="font-bold text-sm">Instructor</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Personal Details Section */}
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Full Name <span className="text-red-400">*</span></label>
                                            <Input
                                                name="name"
                                                placeholder="Enter full name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.name ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Email Address <span className="text-red-400">*</span></label>
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.email ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Phone Number <span className="text-red-400">*</span></label>
                                            <Input
                                                name="phone"
                                                placeholder="9876543210"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.phone ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Date of Birth <span className="text-red-400">*</span></label>
                                            <Input
                                                name="dob"
                                                type="date"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white ${errors.dob ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.dob && <p className="text-xs text-red-400">{errors.dob}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5 col-span-2 md:col-span-1">
                                            <label className="text-xs font-medium text-zinc-400">Current Belt <span className="text-red-400">*</span></label>
                                            <select
                                                name="currentBeltRank"
                                                value={formData.currentBeltRank}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`w-full h-11 rounded-lg border bg-zinc-950/50 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors ${errors.currentBeltRank ? 'border-red-500/50' : 'border-white/10'}`}
                                            >
                                                <option value="" className="bg-zinc-900">Select</option>
                                                {BELT_RANKS.map(belt => (
                                                    <option key={belt} value={belt} className="bg-zinc-900">{belt}</option>
                                                ))}
                                            </select>
                                            {errors.currentBeltRank && <p className="text-xs text-red-400">{errors.currentBeltRank}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Height (cm) <span className="text-red-400">*</span></label>
                                            <Input
                                                name="height"
                                                type="number"
                                                placeholder="175"
                                                value={formData.height}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.height ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.height && <p className="text-xs text-red-400">{errors.height}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Weight (kg) <span className="text-red-400">*</span></label>
                                            <Input
                                                name="weight"
                                                type="number"
                                                placeholder="70"
                                                value={formData.weight}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.weight ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.weight && <p className="text-xs text-red-400">{errors.weight}</p>}
                                        </div>
                                        {role === "INSTRUCTOR" && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">Years of Experience <span className="text-red-400">*</span></label>
                                                <Input
                                                    name="yearsOfExperience"
                                                    type="number"
                                                    placeholder="5"
                                                    value={formData.yearsOfExperience}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.yearsOfExperience ? 'border-red-500/50' : ''}`}
                                                />
                                                {errors.yearsOfExperience && <p className="text-xs text-red-400">{errors.yearsOfExperience}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Guardian Details - Only for Students */}
                                    {role === "STUDENT" && (
                                        <>
                                            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-4 mb-2">Guardian Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-400">Father's Name <span className="text-red-400">*</span></label>
                                                    <Input
                                                        name="fatherName"
                                                        placeholder="Enter father's name"
                                                        value={formData.fatherName}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.fatherName ? 'border-red-500/50' : ''}`}
                                                    />
                                                    {errors.fatherName && <p className="text-xs text-red-400">{errors.fatherName}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-400">Father's Phone <span className="text-red-400">*</span></label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            name="countryCode"
                                                            value={formData.countryCode}
                                                            onChange={handleChange}
                                                            className="w-20 h-11 rounded-lg border border-white/10 bg-zinc-950/50 px-2 text-xs text-white focus:outline-none focus:border-red-500"
                                                        >
                                                            {COUNTRY_CODES.map(c => (
                                                                <option key={c.code} value={c.code} className="bg-zinc-900">{c.flag} {c.code}</option>
                                                            ))}
                                                        </select>
                                                        <Input
                                                            name="fatherPhone"
                                                            placeholder="9876543210"
                                                            value={formData.fatherPhone}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            className={`flex-1 bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.fatherPhone ? 'border-red-500/50' : ''}`}
                                                        />
                                                    </div>
                                                    {errors.fatherPhone && <p className="text-xs text-red-400">{errors.fatherPhone}</p>}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Dojo Selection Section */}
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Location & Dojo
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">State <span className="text-red-400">*</span></label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`w-full h-11 rounded-lg border bg-zinc-950/50 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors ${errors.state ? 'border-red-500/50' : 'border-white/10'}`}
                                            >
                                                <option value="" className="bg-zinc-900">Select State</option>
                                                {INDIAN_STATES.map(s => (
                                                    <option key={s} value={s} className="bg-zinc-900">{s}</option>
                                                ))}
                                            </select>
                                            {errors.state && <p className="text-xs text-red-400">{errors.state}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">City <span className="text-red-400">*</span></label>
                                            <select
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={!formData.state}
                                                className={`w-full h-11 rounded-lg border bg-zinc-950/50 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 ${errors.city ? 'border-red-500/50' : 'border-white/10'}`}
                                            >
                                                <option value="" className="bg-zinc-900">Select City</option>
                                                {availableCities.map((c: string) => (
                                                    <option key={c} value={c} className="bg-zinc-900">{c}</option>
                                                ))}
                                            </select>
                                            {errors.city && <p className="text-xs text-red-400">{errors.city}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-400">
                                            Select Dojo {role === "STUDENT" && <span className="text-red-400">*</span>}
                                            {role === "INSTRUCTOR" && <span className="text-zinc-500">(Optional)</span>}
                                        </label>
                                        <select
                                            name="dojoId"
                                            value={formData.dojoId}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            disabled={!formData.city || loadingDojos}
                                            className={`w-full h-11 rounded-lg border bg-zinc-950/50 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 ${errors.dojoId ? 'border-red-500/50' : 'border-white/10'}`}
                                        >
                                            <option value="" className="bg-zinc-900">{loadingDojos ? "Loading..." : "Choose your dojo"}</option>
                                            {dojos.map(d => (
                                                <option key={d.id} value={d.id} className="bg-zinc-900">{d.name} - {d.city}</option>
                                            ))}
                                            {formData.city && (
                                                <option value="fallback" className="bg-zinc-900">
                                                    🥋 No dojo nearby? Register directly
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
                                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                                                    {selectedDojo.instructors[0].name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-zinc-400 uppercase">Assigned Instructor</p>
                                                    <p className="text-sm font-bold text-white">{selectedDojo.instructors[0].name}</p>
                                                </div>
                                                <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Security Section */}
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Account Security
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Password <span className="text-red-400">*</span></label>
                                            <Input
                                                name="password"
                                                type="password"
                                                placeholder="Min. 8 characters"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.password ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Confirm Password <span className="text-red-400">*</span></label>
                                            <Input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Re-enter password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                                            />
                                            {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 mt-8 text-base font-bold bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-red-600/50 rounded-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            Complete Registration
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-xs text-zinc-500 mt-4">
                                    By registering, you agree to our Terms of Service
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
