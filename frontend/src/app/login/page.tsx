"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getRememberedEmail } from "@/lib/tokenStorage";
import AuthShell from "@/components/auth/AuthShell";
import { Field, FormAlert, FormHeading, PasswordInput, inputClass, primaryButtonClass } from "@/components/auth/fields";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const { login, isLoading, error } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        useAuthStore.setState({ error: null });
        // Read after mount (storage is client-only); a frame later keeps it out of the render pass.
        const id = requestAnimationFrame(() => {
            const remembered = getRememberedEmail();
            if (remembered) setEmail(remembered);
        });
        return () => cancelAnimationFrame(id);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password }, rememberMe);
            router.push("/dashboard");
        } catch {
            // Error managed by the store
        }
    };

    return (
        <AuthShell
            image="/history/solitude.jpg"
            imageAlt="A karateka kneeling alone in a quiet dojo, light falling across the floor"
            title={<>Welcome back<span className="text-primary">.</span></>}
            lede="Sign in to manage your dojo, follow your belt journey, and register for events."
        >
            <FormHeading title="Sign in" lede="Use the email you registered with." />

            {error && <FormAlert>{error}</FormAlert>}

            <form onSubmit={handleSubmit} className="space-y-8">
                <Field id="login-email" label="Email">
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                    />
                </Field>

                <div>
                    <div className="mb-2 flex items-baseline justify-between gap-4">
                        <label htmlFor="login-password" className="text-sm font-semibold text-white/80">
                            Password
                        </label>
                        <Link href="/forgot-password" className="text-sm font-semibold text-white/70 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white">
                            Forgot password?
                        </Link>
                    </div>
                    <PasswordInput
                        id="login-password"
                        autoComplete="current-password"
                        placeholder="Your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <label className="flex min-h-11 cursor-pointer select-none items-center gap-3 text-sm text-white/75">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-none border-white/30 bg-transparent accent-primary"
                    />
                    Keep me signed in on this device
                </label>

                <button type="submit" disabled={isLoading} className={`${primaryButtonClass} group w-full`}>
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in
                        </>
                    ) : (
                        <>
                            Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-10 border-t border-white/10 pt-8 text-white/70">
                New to KKFI?{" "}
                <Link href="/register" className="font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary-light">
                    Create your membership
                </Link>
            </p>
        </AuthShell>
    );
}
