"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import api from "@/lib/api";
import AuthShell from "@/components/auth/AuthShell";
import { Field, FormAlert, FormHeading, inputClass, outlineButtonClass, primaryButtonClass } from "@/components/auth/fields";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            image="/history/belt-grip.jpg"
            imageAlt="Hands tightening a black belt at the waist"
            title={<>Back on the mat<span className="text-primary">.</span></>}
            lede="Forgotten passwords happen. We will send a link to set a new one."
            backHref="/login"
            backLabel="Back to sign in"
        >
            {sent ? (
                <div role="status">
                    <span className="mb-8 flex h-12 w-12 items-center justify-center border border-white/25">
                        <Check className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                    <FormHeading
                        title="Check your email"
                        lede={
                            <>
                                We have sent a password reset link to <span className="font-semibold text-white">{email}</span>.
                                It expires in one hour; if you do not see it, check your spam folder.
                            </>
                        }
                    />
                    <Link href="/login" className={outlineButtonClass}>
                        Return to sign in
                    </Link>
                </div>
            ) : (
                <>
                    <FormHeading title="Reset your password" lede="Enter the email you registered with and we will send you a reset link." />

                    {error && <FormAlert>{error}</FormAlert>}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Field id="forgot-email" label="Email">
                            <input
                                id="forgot-email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <button type="submit" disabled={isLoading} className={`${primaryButtonClass} w-full`}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending
                                </>
                            ) : (
                                "Send reset link"
                            )}
                        </button>
                    </form>

                    <p className="mt-10 border-t border-white/10 pt-8 text-white/70">
                        Remembered it?{" "}
                        <Link href="/login" className="font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary-light">
                            Sign in
                        </Link>
                    </p>
                </>
            )}
        </AuthShell>
    );
}
