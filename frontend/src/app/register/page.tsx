"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import {
    Field,
    FormAlert,
    PasswordInput,
    describedBy,
    inputClass,
    selectClass,
    primaryButtonClass,
    outlineButtonClass,
} from "@/components/auth/fields";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { INDIAN_STATES, CITIES, BELT_RANKS, COUNTRY_CODES } from "@/lib/constants";

const ADMIN_INSTRUCTOR_ID = "42b18481-85ee-49ed-8b3c-dc4f707fe29e"; // Sihan Vasant Kumar Singh

export default function RegisterPage() {
    const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
    const [submitState, setSubmitState] = useState<"form" | "verifying" | "done">("form");
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 6;
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

            setSubmitState("verifying");
            await register(payload);
            setSubmitState("done");
            setTimeout(() => router.push("/dashboard"), 1500);

        } catch {
            setSubmitState("form");
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

    const STEP_LABELS = ["You", "Contact", "Training", role === "STUDENT" ? "Guardian" : "Experience", "Dojo", "Account"];

    type FieldName = keyof typeof formData;
    /** Wires a control to the shared handlers, its error text and aria state. */
    const bind = (name: FieldName, hint = false) => ({
        id: `reg-${name}`,
        name,
        value: formData[name],
        onChange: handleChange,
        onBlur: handleBlur,
        "aria-invalid": errors[name] ? true : undefined,
        "aria-describedby": describedBy(`reg-${name}`, { hint, error: errors[name] }),
    });

    const stepNav = (
        <div className="flex items-center justify-between gap-3 pt-4">
            {step > 1 ? (
                <button type="button" onClick={prevStep} className={outlineButtonClass}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
            ) : (
                <span />
            )}
            <button type="button" onClick={nextStep} className={`${primaryButtonClass} group`}>
                Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
        </div>
    );

    const sectionTitle = (title: string, lede?: string) => (
        <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-[-0.01em] text-white">{title}</h2>
            {lede && <p className="mt-2 text-white/65">{lede}</p>}
        </div>
    );

    return (
        <AuthShell
            image="/history/belt-grip.jpg"
            imageAlt="Hands tightening a black belt at the waist"
            title={<>Begin as a white belt<span className="text-primary">.</span></>}
            lede="Six short steps to your KKFI membership. Your instructor approves it, and it runs for a year."
            width="wide"
        >
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">Join KKFI</h1>
                <p className="text-sm text-white/65">
                    Already a member?{" "}
                    <Link href="/login" className="font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary-light">
                        Sign in
                    </Link>
                </p>
            </div>

            {authError && <FormAlert>{authError}</FormAlert>}

            {/* Progress: a real sequence, so it is numbered. */}
            <nav aria-label="Registration progress" className="mb-12">
                <p className="mb-3 text-sm font-semibold text-white/80">
                    Step {step} of {TOTAL_STEPS} <span className="text-white/45">·</span> {STEP_LABELS[step - 1]}
                </p>
                <ol className="grid grid-cols-6 gap-1.5">
                    {STEP_LABELS.map((label, i) => {
                        const n = i + 1;
                        const state = step > n ? "done" : step === n ? "current" : "todo";
                        return (
                            <li key={label} aria-current={state === "current" ? "step" : undefined}>
                                <span
                                    className={`block h-1 transition-colors duration-300 ${state === "done" ? "bg-white" : state === "current" ? "bg-primary" : "bg-white/15"}`}
                                    aria-hidden="true"
                                />
                                <span className={`mt-2 hidden text-xs font-semibold sm:block ${state === "current" ? "text-white" : state === "done" ? "text-white/70" : "text-white/40"}`}>
                                    {n}. {label}
                                </span>
                                <span className="sr-only">
                                    Step {n}, {label}: {state === "done" ? "complete" : state === "current" ? "current" : "not started"}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </nav>

            <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait" initial={false}>
                    {/* STEP 1: Role + Name + Email */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                            <fieldset>
                                <legend className="mb-3 text-sm font-semibold text-white/80">I am joining as</legend>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["STUDENT", "INSTRUCTOR"] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            aria-pressed={role === r}
                                            className={`min-h-14 border px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                                role === r ? "border-primary bg-primary/10 text-white" : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
                                            }`}
                                        >
                                            <span className="block font-bold">{r === "STUDENT" ? "Student" : "Instructor"}</span>
                                            <span className="block text-sm text-white/60">{r === "STUDENT" ? "Training at a dojo" : "Teaching a class"}</span>
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            <Field id="reg-name" label="Full name" required error={errors.name}>
                                <input {...bind("name")} autoComplete="name" placeholder="As it should appear on certificates" className={inputClass} />
                            </Field>
                            <Field id="reg-email" label="Email" required error={errors.email}>
                                <input {...bind("email")} type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
                            </Field>

                            {stepNav}
                        </motion.div>
                    )}

                    {/* STEP 2: Phone + DOB */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                            {sectionTitle("Contact details", "So your dojo can reach you about classes and gradings.")}
                            <Field id="reg-phone" label="Phone number" required error={errors.phone}>
                                <input {...bind("phone")} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="10-digit mobile number" className={inputClass} />
                            </Field>
                            <Field id="reg-dob" label="Date of birth" required error={errors.dob}>
                                <input {...bind("dob")} type="date" autoComplete="bday" className={inputClass} />
                            </Field>
                            {stepNav}
                        </motion.div>
                    )}

                    {/* STEP 3: Training Details (Belt + Height + Weight) */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                            {sectionTitle("Training", "Your belt today, and the measurements used for tournament categories.")}

                            <div className="grid gap-8 md:grid-cols-2">
                                <Field
                                    id="reg-currentBeltRank"
                                    label={role === "INSTRUCTOR" ? "Current belt" : "Starting belt"}
                                    required
                                    error={errors.currentBeltRank}
                                    hint={
                                        role === "STUDENT"
                                            ? formData.currentBeltRank === "White"
                                                ? "No verification needed."
                                                : "Your instructor will verify this belt."
                                            : undefined
                                    }
                                >
                                    <select {...bind("currentBeltRank", role === "STUDENT")} className={selectClass}>
                                        {BELT_RANKS.map((belt) => (
                                            <option key={belt} value={belt}>{belt}</option>
                                        ))}
                                    </select>
                                </Field>

                                {/* Belt Exam Date - Only for Students claiming higher belts */}
                                {role === "STUDENT" && formData.currentBeltRank !== "White" && (
                                    <Field id="reg-beltExamDate" label="Belt exam date" required error={errors.beltExamDate} hint="When did you earn this belt?">
                                        <input {...bind("beltExamDate", true)} type="date" max={new Date().toISOString().split("T")[0]} className={inputClass} />
                                    </Field>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <Field id="reg-height" label="Height (cm)" required error={errors.height}>
                                    <input {...bind("height")} type="number" inputMode="numeric" placeholder="175" className={inputClass} />
                                </Field>
                                <Field id="reg-weight" label="Weight (kg)" required error={errors.weight}>
                                    <input {...bind("weight")} type="number" inputMode="numeric" placeholder="70" className={inputClass} />
                                </Field>
                            </div>

                            {/* Martial Arts Experience */}
                            <fieldset>
                                <legend className="mb-2 text-sm font-semibold text-white/80">
                                    Martial arts experience<span className="text-primary-light" aria-hidden="true"> *</span>
                                </legend>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label htmlFor="reg-experienceYears" className="sr-only">Years</label>
                                        <select {...bind("experienceYears", true)} className={selectClass}>
                                            {Array.from({ length: 51 }, (_, i) => (
                                                <option key={i} value={String(i)}>{i} {i === 1 ? "Year" : "Years"}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="reg-experienceMonths" className="sr-only">Months</label>
                                        <select {...bind("experienceMonths", true)} className={selectClass}>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i} value={String(i)}>{i} {i === 1 ? "Month" : "Months"}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <p id="reg-experienceYears-hint" className="mt-2 text-sm text-white/55">Total time training in any martial art.</p>
                                <span id="reg-experienceMonths-hint" className="sr-only">Total time training in any martial art.</span>
                            </fieldset>

                            {stepNav}
                        </motion.div>
                    )}

                    {/* STEP 4: Guardian (Students) or Experience (Instructors) */}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                            {role === "STUDENT"
                                ? sectionTitle("Guardian", "A parent or guardian we can contact.")
                                : sectionTitle("Teaching experience")}

                            {role === "STUDENT" && (
                                <>
                                    <Field id="reg-fatherName" label="Father's name" required error={errors.fatherName}>
                                        <input {...bind("fatherName")} autoComplete="off" placeholder="Full name" className={inputClass} />
                                    </Field>
                                    <div>
                                        <label htmlFor="reg-fatherPhone" className="mb-2 block text-sm font-semibold text-white/80">
                                            Father&apos;s phone<span className="text-primary-light" aria-hidden="true"> *</span>
                                        </label>
                                        <div className="flex gap-4">
                                            <label htmlFor="reg-countryCode" className="sr-only">Country code</label>
                                            <select id="reg-countryCode" name="countryCode" value={formData.countryCode} onChange={handleChange} className={`${selectClass} w-28 shrink-0`}>
                                                {COUNTRY_CODES.map((c) => (
                                                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                                ))}
                                            </select>
                                            <input {...bind("fatherPhone")} type="tel" inputMode="tel" placeholder="10-digit mobile number" className={`${inputClass} flex-1`} />
                                        </div>
                                        {errors.fatherPhone && (
                                            <p id="reg-fatherPhone-error" className="mt-2 text-sm font-medium text-primary-light">{errors.fatherPhone}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {role === "INSTRUCTOR" && (
                                <Field id="reg-yearsOfExperience" label="Years of experience" required error={errors.yearsOfExperience}>
                                    <input {...bind("yearsOfExperience")} type="number" inputMode="numeric" placeholder="5" className={inputClass} />
                                </Field>
                            )}

                            {stepNav}
                        </motion.div>
                    )}

                    {/* STEP 5: Location & Dojo */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                            {sectionTitle("Your dojo", "Choose where you train. Your instructor approves your membership.")}

                            <div className="grid gap-8 md:grid-cols-2">
                                <Field id="reg-state" label="State" required error={errors.state}>
                                    <select {...bind("state")} className={selectClass}>
                                        <option value="">Select state</option>
                                        {INDIAN_STATES.map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field id="reg-city" label="City" required error={errors.city}>
                                    <select {...bind("city")} disabled={!formData.state} className={selectClass}>
                                        <option value="">{formData.state ? "Select city" : "Choose a state first"}</option>
                                        {availableCities.map((c: string) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <Field id="reg-dojoId" label="Dojo" required={role === "STUDENT"} optional={role === "INSTRUCTOR"} error={errors.dojoId}>
                                <select {...bind("dojoId")} disabled={!formData.city || loadingDojos} className={selectClass}>
                                    <option value="">{loadingDojos ? "Loading dojos…" : formData.city ? "Choose your dojo" : "Choose a city first"}</option>
                                    {dojos.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name} - {d.city}</option>
                                    ))}
                                    {formData.city && (
                                        <option value="fallback">No dojo nearby? Register directly</option>
                                    )}
                                </select>
                            </Field>

                            {/* Instructor Display */}
                            {selectedDojo && selectedDojo.instructors && selectedDojo.instructors.length > 0 && (
                                <div className="flex items-center gap-4 border border-white/15 p-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/25 text-lg font-black text-white" aria-hidden="true">
                                        {selectedDojo.instructors[0].name.charAt(0)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white/60">Your instructor</p>
                                        <p className="font-bold text-white">{selectedDojo.instructors[0].name}</p>
                                    </div>
                                    <Check className="ml-auto h-5 w-5 text-white" aria-hidden="true" />
                                </div>
                            )}

                            {stepNav}
                        </motion.div>
                    )}

                    {/* STEP 6: Account security. No payment is taken here — the
                        "Payment" in the old label was left over from a removed step. */}
                    {step === 6 && (
                        <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                            {sectionTitle("Your account", "The password you will sign in with.")}

                            <div className="grid gap-8 md:grid-cols-2">
                                <Field id="reg-password" label="Password" required error={errors.password} hint="At least 8 characters, with a special character.">
                                    <PasswordInput {...bind("password", true)} autoComplete="new-password" placeholder="Create a password" />
                                </Field>
                                <Field id="reg-confirmPassword" label="Confirm password" required error={errors.confirmPassword}>
                                    <PasswordInput {...bind("confirmPassword")} autoComplete="new-password" placeholder="Repeat it" />
                                </Field>
                            </div>

                            {/* One action row: fixed above the bottom nav on phones, inline on wider screens. */}
                            <div className="sticky-action-bar">
                                <div className="flex gap-3">
                                    <button type="button" onClick={prevStep} aria-label="Back" className={`${outlineButtonClass} px-4 md:px-6`}>
                                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                        <span className="hidden md:inline">Back</span>
                                    </button>
                                    <button type="submit" disabled={isLoading || submitState !== "form"} className={`${primaryButtonClass} flex-1`}>
                                        {submitState === "verifying" ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating account
                                            </>
                                        ) : submitState === "done" ? (
                                            <>
                                                <Check className="h-4 w-4" aria-hidden="true" /> Registration complete
                                            </>
                                        ) : isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Processing
                                            </>
                                        ) : (
                                            "Create account"
                                        )}
                                    </button>
                                </div>
                            </div>
                            {/* Public signup takes no payment and creates the account with
                                membershipStatus PENDING — the 1-year window and membership
                                number are issued by approveUser, on instructor approval. The
                                previous copy promised "valid for 1 year from the date of
                                registration", which was never true on this path. */}
                            <p className="text-sm leading-relaxed text-white/60">
                                By registering, you agree to our{" "}
                                <Link href="/terms" className="underline decoration-white/30 underline-offset-4 hover:text-white">Terms of Service</Link>. Your account is created
                                straight away — your membership becomes active once your instructor approves
                                it, and then runs for one year.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </AuthShell>
    );
}
