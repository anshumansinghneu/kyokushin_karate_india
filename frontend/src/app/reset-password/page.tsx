"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { setTokens } from "@/lib/tokenStorage";
import AuthShell from "@/components/auth/AuthShell";
import KarateLoader from "@/components/KarateLoader";
import { Field, FormAlert, FormHeading, PasswordInput, describedBy, primaryButtonClass } from "@/components/auth/fields";

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
    return (
        <li className={`flex items-center gap-2 text-sm transition-colors ${met ? "text-white" : "text-white/55"}`}>
            <span className={`flex h-4 w-4 items-center justify-center border ${met ? "border-white bg-white text-black" : "border-white/30"}`} aria-hidden="true">
                {met && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            {children}
            <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
        </li>
    );
}

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Validation states
    const hasMinLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const mismatch = confirmPassword.length > 0 && !passwordsMatch;

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new password reset link.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!hasMinLength || !hasSpecialChar) {
            setError("Password must be at least 8 characters with a special character.");
            return;
        }
        if (!passwordsMatch) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post("/auth/reset-password", { token, password });
            const { token: jwt } = res.data;
            if (jwt) {
                setTokens(jwt, null, true);
            }
            setSuccess(true);
            // Auto-redirect to dashboard after 2s
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || "Reset failed. The link may have expired.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div role="status">
                <span className="mb-8 flex h-12 w-12 items-center justify-center border border-white/25">
                    <Check className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
                <FormHeading title="Password updated" lede="Your new password is set. Taking you to your dashboard…" />
            </div>
        );
    }

    return (
        <>
            <FormHeading title="Set a new password" lede="Choose a strong password for your account." />

            {error && <FormAlert>{error}</FormAlert>}

            <form onSubmit={handleSubmit} className="space-y-8">
                <Field id="reset-password" label="New password" hint={password.length === 0 ? "At least 8 characters, including a special character." : undefined}>
                    <PasswordInput
                        id="reset-password"
                        autoComplete="new-password"
                        placeholder="New password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-describedby={password.length > 0 ? "reset-password-reqs" : describedBy("reset-password", { hint: true })}
                    />
                    {password.length > 0 && (
                        <ul id="reset-password-reqs" className="mt-3 space-y-1.5">
                            <Requirement met={hasMinLength}>At least 8 characters</Requirement>
                            <Requirement met={hasSpecialChar}>Contains a special character</Requirement>
                        </ul>
                    )}
                </Field>

                <Field id="reset-confirm-password" label="Confirm password" error={mismatch ? "Passwords do not match" : undefined}>
                    <PasswordInput
                        id="reset-confirm-password"
                        autoComplete="new-password"
                        placeholder="Repeat the password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        aria-invalid={mismatch || undefined}
                        aria-describedby={describedBy("reset-confirm-password", { error: mismatch ? "mismatch" : undefined })}
                    />
                </Field>

                <button type="submit" disabled={isLoading || !token} className={`${primaryButtonClass} w-full`}>
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving
                        </>
                    ) : (
                        "Reset password"
                    )}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthShell
            image="/history/belt-grip.jpg"
            imageAlt="Hands tightening a black belt at the waist"
            title={<>Back on the mat<span className="text-primary">.</span></>}
            lede="Set a new password and pick up where you left off."
            backHref="/login"
            backLabel="Back to sign in"
        >
            <Suspense fallback={<div className="py-16"><KarateLoader /></div>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthShell>
    );
}
