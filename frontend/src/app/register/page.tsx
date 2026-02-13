"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, User, GraduationCap, CreditCard, Shield, Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { INDIAN_STATES, CITIES, BELT_RANKS, COUNTRY_CODES } from "@/lib/constants";

const ADMIN_INSTRUCTOR_ID = "42b18481-85ee-49ed-8b3c-dc4f707fe29e"; // Sihan Vasant Kumar Singh

// Razorpay types
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

export default function RegisterPage() {
    const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [paymentStep, setPaymentStep] = useState<"form" | "paying" | "verifying" | "done">("form");
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 6;
    const [paymentInfo, setPaymentInfo] = useState<{ amount: number; taxAmount: number; totalAmount: number } | null>(null);
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
        currentBeltRank: "White", // Default to White for students
        beltExamDate: "", // Date when student claims they passed belt exam
        beltClaimReason: "", // Optional reason for claiming higher belt
        instructorId: "",
        fatherName: "",
        fatherPhone: "",
        yearsOfExperience: "",
        experienceYears: "0",
        experienceMonths: "0"
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [, setLocations] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dojos, setDojos] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedDojo, setSelectedDojo] = useState<any>(null);
    const [, setLoadingLocations] = useState(true);
    const [loadingDojos, setLoadingDojos] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [, setAge] = useState<number | null>(null); // Derived age state

    // Voucher state
    const [hasVoucher, setHasVoucher] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState<{ amount: number; code: string } | null>(null);
    const [voucherError, setVoucherError] = useState("");

    const { registerWithPayment, completeRegistration, registerWithVoucher, isLoading, error: authError } = useAuthStore();
    const router = useRouter();

    // Fetch Locations on Mount + Load Razorpay Script + Fetch Payment Config
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

        // Load Razorpay checkout script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        // Fetch payment config
        const fetchPaymentConfig = async () => {
            try {
                const res = await api.get('/payments/config');
                setPaymentInfo({
                    amount: res.data.data.membershipFee,
                    taxAmount: res.data.data.taxAmount,
                    totalAmount: res.data.data.totalAmount,
                });
            } catch (err) {
                console.error("Failed to fetch payment config", err);
                // Fallback
                setPaymentInfo({ amount: 250, taxAmount: 45, totalAmount: 295 });
            }
        };
        fetchPaymentConfig();

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
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
                else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) error = "Password must contain at least one special character";
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
                if (role === "INSTRUCTOR" && !value) error = "Please select your current belt";
                break;
            case "beltExamDate":
                if (role === "STUDENT" && formData.currentBeltRank !== "White" && !value) {
                    error = "Belt exam date is required for higher belts";
                } else if (value) {
                    const examDate = new Date(value);
                    const today = new Date();
                    if (examDate > today) error = "Exam date cannot be in the future";
                }
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

    // Voucher validation
    const handleValidateVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError("Please enter a voucher code");
            return;
        }
        setVoucherValidating(true);
        setVoucherError("");
        setVoucherValid(null);
        try {
            const res = await api.post('/vouchers/validate', {
                code: voucherCode.trim(),
                type: 'MEMBERSHIP',
            });
            setVoucherValid({
                amount: res.data.data.voucher.amount,
                code: res.data.data.voucher.code,
            });
        } catch (err: any) {
            setVoucherError(err.response?.data?.message || "Invalid voucher code");
        } finally {
            setVoucherValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields based on role
        const newErrors: Record<string, string> = {};
        const fieldsToValidate = role === "STUDENT"
            ? ["name", "email", "password", "confirmPassword", "phone", "dob", "height", "weight", "state", "city", "dojoId", "fatherName", "fatherPhone", "currentBeltRank"]
            : ["name", "email", "password", "confirmPassword", "phone", "dob", "height", "weight", "state", "city", "currentBeltRank", "yearsOfExperience"];

        // Add beltExamDate to validation if student claiming higher belt
        if (role === "STUDENT" && formData.currentBeltRank !== "White") {
            fieldsToValidate.push("beltExamDate");
        }

        fieldsToValidate.forEach(key => {
            const error = validateField(key, formData[key as keyof typeof formData]);
            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        setTouched(fieldsToValidate.reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (Object.keys(newErrors).length > 0) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                ...formData,
                role,
                height: Number(formData.height),
                weight: Number(formData.weight)
            };

            // Remove confirmPassword - not needed by backend
            delete payload.confirmPassword;

            // Add experience fields for both roles
            payload.experienceYears = Number(formData.experienceYears) || 0;
            payload.experienceMonths = Number(formData.experienceMonths) || 0;

            // Add instructor-specific fields
            if (role === "INSTRUCTOR") {
                payload.yearsOfExperience = Number(formData.yearsOfExperience);
                delete payload.fatherName;
                delete payload.fatherPhone;
                delete payload.beltExamDate;
                delete payload.beltClaimReason;
                if (!formData.dojoId) delete payload.dojoId;
            } else {
                if (formData.currentBeltRank !== "White") {
                    payload.beltExamDate = formData.beltExamDate;
                    payload.beltClaimReason = formData.beltClaimReason || "";
                } else {
                    delete payload.beltExamDate;
                    delete payload.beltClaimReason;
                }
                delete payload.yearsOfExperience;
            }

            // ── VOUCHER PATH: Skip Razorpay ──
            if (voucherValid) {
                setPaymentStep("verifying");
                await registerWithVoucher({
                    ...payload,
                    voucherCode: voucherValid.code,
                });
                setPaymentStep("done");
                setTimeout(() => router.push("/dashboard"), 1500);
                return;
            }

            // ── RAZORPAY PATH ──
            // ── Step 1: Create Payment Order ──
            setPaymentStep("paying");
            const orderData = await registerWithPayment(payload);

            // ── Step 2: Open Razorpay Checkout ──
            if (!window.Razorpay) {
                throw new Error("Payment gateway not loaded. Please refresh and try again.");
            }

            const options = {
                key: orderData.keyId,
                amount: Math.round(orderData.totalAmount * 100), // in paise
                currency: "INR",
                name: "Kyokushin Karate India",
                description: "Annual Membership Fee",
                order_id: orderData.orderId,
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: {
                    type: "membership_registration",
                },
                theme: {
                    color: "#DC2626",
                },
                modal: {
                    ondismiss: () => {
                        setPaymentStep("form");
                    },
                },
                handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                    // ── Step 3: Verify Payment & Create Account ──
                    try {
                        setPaymentStep("verifying");
                        await completeRegistration({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setPaymentStep("done");
                        setTimeout(() => router.push("/dashboard"), 1500);
                    } catch {
                        setPaymentStep("form");
                    }
                },
            };

            const razorpay = new window.Razorpay(options);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            razorpay.on("payment.failed", (response: any) => {
                console.error("Payment failed:", response.error);
                setPaymentStep("form");
                useAuthStore.setState({
                    error: `Payment failed: ${response.error.description || "Please try again"}`,
                });
            });
            razorpay.open();

        } catch {
            setPaymentStep("form");
        }
    };

    // Get available cities based on selected state
    const availableCities = formData.state ? CITIES[formData.state] || [] : [];

    // Step validation
    const getStepFields = (s: number): string[] => {
        switch (s) {
            case 1: return ["name", "email"];
            case 2: return ["phone", "dob"];
            case 3: return ["currentBeltRank", "height", "weight", "experienceYears", "experienceMonths", ...(formData.currentBeltRank !== "White" ? ["beltExamDate"] : [])];
            case 4: return role === "STUDENT"
                ? ["fatherName", "fatherPhone"]
                : ["yearsOfExperience"];
            case 5: return role === "STUDENT" ? ["state", "city", "dojoId"] : ["state", "city"];
            case 6: return ["password", "confirmPassword"];
            default: return [];
        }
    };

    const validateStep = (s: number): boolean => {
        const fields = getStepFields(s);
        const newErrors: Record<string, string> = {};
        fields.forEach(key => {
            const error = validateField(key, formData[key as keyof typeof formData]);
            if (error) newErrors[key] = error;
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        setTouched(prev => ({ ...prev, ...fields.reduce((acc, k) => ({ ...acc, [k]: true }), {}) }));
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
        }
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const STEP_LABELS = ["You", "Contact", "Training", role === "STUDENT" ? "Guardian" : "Experience", "Dojo", "Payment"];

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-black text-white font-sans selection:bg-red-500/30">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-black z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

            {/* Left Side - Hero Section (hidden on mobile & tablet for more content space) */}
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
                    <span>© {new Date().getFullYear()} Kyokushin India</span>
                    <span>Osu!</span>
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-1/2 flex flex-col relative z-20 h-screen overflow-y-auto scrollbar-hide">
                <div className="min-h-full flex flex-col justify-start p-3 sm:p-4 md:p-8 lg:p-12 py-4 sm:py-6 md:py-8 pb-32 md:pb-8">
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
                            className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl"
                        >
                            <div className="mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">Join the Dojo</h2>
                                <p className="text-sm text-zinc-400">Begin your martial arts journey</p>
                            </div>

                            {authError && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {authError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                {/* Step Progress Bar */}
                                <div className="flex items-center justify-between mb-2 gap-0.5">
                                    {STEP_LABELS.map((label, i) => (
                                        <div key={label} className="flex items-center flex-1">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                                                    step > i + 1 ? 'bg-green-500 text-white' :
                                                    step === i + 1 ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' :
                                                    'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                                }`}>
                                                    {step > i + 1 ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : i + 1}
                                                </div>
                                                <span className={`text-[8px] sm:text-[10px] mt-1 font-bold uppercase tracking-wider ${
                                                    step === i + 1 ? 'text-red-400' : 'text-zinc-600'
                                                }`}>{label}</span>
                                            </div>
                                            {i < STEP_LABELS.length - 1 && (
                                                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-all duration-300 ${
                                                    step > i + 1 ? 'bg-green-500' : 'bg-zinc-800'
                                                }`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                {/* STEP 1: Role + Name + Email */}
                                {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                                {/* Role Selection Toggle */}
                                <div className="space-y-3 pb-4 sm:pb-6 border-b border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-sm">1</span>
                                        <label className="text-sm font-bold text-white uppercase tracking-wider">Who are you?</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
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

                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Basic Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="reg-name" className="text-sm sm:text-xs font-medium text-zinc-400">Full Name <span className="text-red-400">*</span></label>
                                            <Input
                                                id="reg-name"
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
                                            <label htmlFor="reg-email" className="text-xs font-medium text-zinc-400">Email Address <span className="text-red-400">*</span></label>
                                            <Input
                                                id="reg-email"
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
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all btn-shine active:scale-[0.98]">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                </motion.div>
                                )}

                                {/* STEP 2: Phone + DOB */}
                                {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Contact Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="reg-phone" className="text-xs font-medium text-zinc-400">Phone Number <span className="text-red-400">*</span></label>
                                            <Input
                                                id="reg-phone"
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
                                            <label htmlFor="reg-dob" className="text-xs font-medium text-zinc-400">Date of Birth <span className="text-red-400">*</span></label>
                                            <Input
                                                id="reg-dob"
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
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all active:scale-[0.98]">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all btn-shine active:scale-[0.98]">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                </motion.div>
                                )}

                                {/* STEP 3: Training Details (Belt + Height + Weight) */}
                                {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Training Details
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Belt Selection for Both Roles */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">
                                                    {role === "INSTRUCTOR" ? "Current Belt" : "Starting Belt"} <span className="text-red-400">*</span>
                                                </label>
                                                <select
                                                    name="currentBeltRank"
                                                    value={formData.currentBeltRank}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`w-full h-12 min-h-[44px] rounded-lg border bg-zinc-950/50 px-3 text-base text-white focus:outline-none focus:border-red-500 transition-colors touch-action-manipulation ${errors.currentBeltRank ? 'border-red-500/50' : 'border-white/10'}`}
                                                >
                                                    {BELT_RANKS.map(belt => (
                                                        <option key={belt} value={belt} className="bg-zinc-900">{belt}</option>
                                                    ))}
                                                </select>
                                                {errors.currentBeltRank && <p className="text-xs text-red-400">{errors.currentBeltRank}</p>}
                                                {role === "STUDENT" && formData.currentBeltRank === "White" && (
                                                    <p className="text-xs text-zinc-500">✓ No verification needed</p>
                                                )}
                                                {role === "STUDENT" && formData.currentBeltRank !== "White" && (
                                                    <p className="text-xs text-amber-400">⚠ Instructor verification required</p>
                                                )}
                                            </div>

                                            {/* Belt Exam Date - Only for Students claiming higher belts */}
                                            {role === "STUDENT" && formData.currentBeltRank !== "White" && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-400">Belt Exam Date <span className="text-red-400">*</span></label>
                                                    <Input
                                                        name="beltExamDate"
                                                        type="date"
                                                        value={formData.beltExamDate}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white ${errors.beltExamDate ? 'border-red-500/50' : ''}`}
                                                    />
                                                    {errors.beltExamDate && <p className="text-xs text-red-400">{errors.beltExamDate}</p>}
                                                    <p className="text-xs text-zinc-500">When did you earn this belt?</p>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
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
                                    </div>

                                    {/* Martial Arts Experience */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-400">Martial Arts Experience <span className="text-red-400">*</span></label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <select
                                                    name="experienceYears"
                                                    value={formData.experienceYears}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`w-full h-12 min-h-[44px] rounded-lg border bg-zinc-950/50 px-3 text-base text-white focus:outline-none focus:border-red-500 transition-colors ${errors.experienceYears ? 'border-red-500/50' : 'border-white/10'}`}
                                                >
                                                    {Array.from({ length: 51 }, (_, i) => (
                                                        <option key={i} value={String(i)} className="bg-zinc-900">{i} {i === 1 ? 'Year' : 'Years'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <select
                                                    name="experienceMonths"
                                                    value={formData.experienceMonths}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`w-full h-12 min-h-[44px] rounded-lg border bg-zinc-950/50 px-3 text-base text-white focus:outline-none focus:border-red-500 transition-colors ${errors.experienceMonths ? 'border-red-500/50' : 'border-white/10'}`}
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <option key={i} value={String(i)} className="bg-zinc-900">{i} {i === 1 ? 'Month' : 'Months'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500">Total time training in any martial art</p>
                                    </div>
                                </div>

                                {/* Step 3 Navigation */}
                                <div className="flex justify-between pt-4">
                                    <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all active:scale-[0.98]">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all btn-shine active:scale-[0.98]">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                </motion.div>
                                )}

                                {/* STEP 4: Guardian (Students) or Experience (Instructors) */}
                                {step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        {role === "STUDENT" ? "Guardian Information" : "Experience"}
                                    </h3>

                                    {/* Guardian Details - Only for Students */}
                                    {role === "STUDENT" && (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">Father&apos;s Name <span className="text-red-400">*</span></label>
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
                                                <label className="text-xs font-medium text-zinc-400">Father&apos;s Phone <span className="text-red-400">*</span></label>
                                                <div className="flex gap-2">
                                                    <select
                                                        name="countryCode"
                                                        value={formData.countryCode}
                                                        onChange={handleChange}
                                                        className="w-24 h-12 min-h-[44px] rounded-lg border border-white/10 bg-zinc-950/50 px-2 text-sm text-white focus:outline-none focus:border-red-500 touch-action-manipulation"
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
                                    )}

                                    {/* Experience - Only for Instructors */}
                                    {role === "INSTRUCTOR" && (
                                        <div className="space-y-4">
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
                                        </div>
                                    )}
                                </div>

                                {/* Step 4 Navigation */}
                                <div className="flex justify-between pt-4">
                                    <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all active:scale-[0.98]">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all btn-shine active:scale-[0.98]">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                </motion.div>
                                )}

                                {/* STEP 5: Location & Dojo */}
                                {step === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                                <div className="space-y-3 sm:space-y-4">
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
                                                className={`w-full h-12 min-h-[44px] rounded-lg border bg-zinc-950/50 px-3 text-base text-white focus:outline-none focus:border-red-500 transition-colors touch-action-manipulation ${errors.state ? 'border-red-500/50' : 'border-white/10'}`}
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
                                                className={`w-full h-12 min-h-[44px] rounded-lg border bg-zinc-950/50 px-3 text-base text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 touch-action-manipulation ${errors.city ? 'border-red-500/50' : 'border-white/10'}`}
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
                                            className={`w-full h-12 min-h-[44px] rounded-lg border bg-zinc-950/50 px-3 text-base text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 touch-action-manipulation ${errors.dojoId ? 'border-red-500/50' : 'border-white/10'}`}
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

                                {/* Step 5 Navigation */}
                                <div className="flex justify-between pt-4">
                                    <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all active:scale-[0.98]">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all btn-shine active:scale-[0.98]">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                </motion.div>
                                )}

                                {/* STEP 6: Security & Payment */}
                                {step === 6 && (
                                <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                                {/* Security Section */}
                                <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                        Account Security
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="reg-password" className="text-xs font-medium text-zinc-400">Password <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Input
                                                    id="reg-password"
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Min. 8 characters"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 pr-11 ${errors.password ? 'border-red-500/50' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors rounded"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="reg-confirm-password" className="text-xs font-medium text-zinc-400">Confirm Password <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Input
                                                    id="reg-confirm-password"
                                                    name="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Re-enter password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`bg-zinc-950/50 border-white/10 focus:border-red-500 h-11 rounded-lg text-white placeholder:text-zinc-600 pr-11 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors rounded"
                                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Voucher Section */}
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                                        Have a Cash Voucher?
                                    </h3>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHasVoucher(!hasVoucher);
                                                if (hasVoucher) {
                                                    setVoucherCode("");
                                                    setVoucherValid(null);
                                                    setVoucherError("");
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasVoucher ? 'bg-green-600' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasVoucher ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-sm text-zinc-400">I have a voucher code for cash payment</span>
                                    </div>

                                    <AnimatePresence>
                                        {hasVoucher && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-3"
                                            >
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter voucher code (e.g. KKFI-ABCD1234)"
                                                        value={voucherCode}
                                                        onChange={(e) => {
                                                            setVoucherCode(e.target.value.toUpperCase());
                                                            setVoucherError("");
                                                            setVoucherValid(null);
                                                        }}
                                                        className="bg-zinc-950/50 border-white/10 focus:border-green-500 h-11 rounded-lg text-white placeholder:text-zinc-600 font-mono tracking-wider"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleValidateVoucher}
                                                        disabled={voucherValidating || !voucherCode.trim()}
                                                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {voucherValidating ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : "Verify"}
                                                    </button>
                                                </div>

                                                {voucherError && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-sm">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {voucherError}
                                                    </motion.div>
                                                )}

                                                {voucherValid && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-bold text-green-400">Voucher Valid!</p>
                                                            <p className="text-xs text-zinc-400">This voucher covers ₹{voucherValid.amount} — no online payment needed.</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Payment Info Section */}
                                {paymentInfo && !voucherValid && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <CreditCard className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Annual Membership Fee</h4>
                                                <p className="text-xs text-zinc-400">One-time payment via UPI / Card / Net Banking</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between text-zinc-400">
                                                <span>Membership Fee</span>
                                                <span>₹{paymentInfo.amount}</span>
                                            </div>
                                            <div className="flex justify-between text-zinc-400">
                                                <span>GST (18%)</span>
                                                <span>₹{paymentInfo.taxAmount}</span>
                                            </div>
                                            <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                                                <span>Total</span>
                                                <span className="text-green-400">₹{paymentInfo.totalAmount}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                                            <Shield className="w-3 h-3" />
                                            <span>Secure payment powered by Razorpay • Valid for 1 year</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Desktop submit button */}
                                <div className="hidden md:block">
                                    <div className="flex gap-3 mt-8">
                                        <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all active:scale-[0.98]">
                                            <ChevronLeft className="w-4 h-4" /> Back
                                        </button>
                                        <Button
                                            type="submit"
                                            className={`flex-1 h-12 text-base font-bold transition-all duration-200 shadow-lg rounded-lg btn-shine ${voucherValid ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-600/50' : 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/50'}`}
                                        disabled={isLoading || paymentStep !== "form"}
                                    >
                                        {paymentStep === "paying" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Opening Payment...
                                            </>
                                        ) : paymentStep === "verifying" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                {voucherValid ? 'Redeeming Voucher...' : 'Verifying Payment...'}
                                            </>
                                        ) : paymentStep === "done" ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Registration Complete!
                                            </>
                                        ) : isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : voucherValid ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Register with Voucher
                                            </>
                                        ) : (
                                            <>
                                                Pay ₹{paymentInfo?.totalAmount || 295} & Register
                                            </>
                                        )}
                                    </Button>
                                    </div>
                                    <p className="text-center text-xs text-zinc-500 mt-4">
                                        By registering, you agree to our Terms of Service. Your membership is valid for 1 year from the date of payment.
                                    </p>
                                </div>

                                {/* Mobile sticky submit button */}
                                <div className="md:hidden sticky-action-bar">
                                    <div className="flex gap-2">
                                        <button type="button" onClick={prevStep} className="flex items-center justify-center p-3 rounded-xl border border-white/10 text-zinc-400 active:scale-[0.95]">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <Button
                                            type="submit"
                                            className={`flex-1 h-14 text-base font-bold transition-all duration-200 shadow-lg rounded-xl btn-shine ${voucherValid ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
                                        disabled={isLoading || paymentStep !== "form"}
                                    >
                                        {paymentStep === "paying" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Opening Payment...
                                            </>
                                        ) : paymentStep === "verifying" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                {voucherValid ? 'Redeeming...' : 'Verifying...'}
                                            </>
                                        ) : paymentStep === "done" ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Done!
                                            </>
                                        ) : isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : voucherValid ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Register with Voucher
                                            </>
                                        ) : (
                                            <>
                                                Pay ₹{paymentInfo?.totalAmount || 295} & Register
                                            </>
                                        )}
                                    </Button>
                                    </div>
                                </div>
                                </motion.div>
                                )}
                                </AnimatePresence>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
