"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * DESIGN.md form primitives for the auth pages: underline fields (a line to
 * write on, not a box), labels always visible, errors tied to the field with
 * aria-describedby, sharp uppercase actions.
 */

export const inputClass =
    "block w-full min-h-12 rounded-none border-0 border-b-2 border-white/25 bg-transparent px-1 text-base text-white placeholder:text-white/45 transition-colors focus:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-primary-light [color-scheme:dark]";

// Plain concatenation, not cn(): tailwind-merge reads bg-[length:..] as a colour
// and drops bg-transparent, which left the selects a grey box.
export const selectClass = `${inputClass} cursor-pointer appearance-none pr-8 [background-repeat:no-repeat] [background-position:right_4px_center] [background-size:16px] [background-image:url("data:image/svg+xml,%3Csvg_xmlns='http://www.w3.org/2000/svg'_viewBox='0_0_24_24'_fill='none'_stroke='%23ffffffb3'_stroke-width='2'%3E%3Cpath_d='m6_9_6_6_6-6'/%3E%3C/svg%3E")] [&>option]:bg-neutral-900`;

export const primaryButtonClass =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-none bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export const outlineButtonClass =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-none border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98]";

/** ids for wiring a control to its hint and error text. */
export function describedBy(id: string, opts: { hint?: boolean; error?: string | false | null }) {
    const ids = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
}

export function Field({
    id,
    label,
    required,
    optional,
    hint,
    error,
    children,
    className,
}: {
    id: string;
    label: React.ReactNode;
    required?: boolean;
    optional?: boolean;
    hint?: React.ReactNode;
    error?: string | false | null;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-sm font-semibold text-white/80">
                {label}
                {required && <span className="text-primary-light" aria-hidden="true"> *</span>}
                {optional && <span className="font-normal text-white/50"> (optional)</span>}
            </label>
            {children}
            {hint && !error && (
                <p id={`${id}-hint`} className="mt-2 text-sm text-white/55">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className="mt-2 text-sm font-medium text-primary-light">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Password input with a show/hide toggle. Spread input props as usual. */
export function PasswordInput({
    id,
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string }) {
    const [shown, setShown] = useState(false);
    return (
        <div className="relative">
            <input id={id} type={shown ? "text" : "password"} className={cn(inputClass, "pr-12", className)} {...props} />
            <button
                type="button"
                onClick={() => setShown((s) => !s)}
                aria-label={shown ? "Hide password" : "Show password"}
                aria-controls={id}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/60 transition-colors hover:text-white focus:outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-primary"
            >
                {shown ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
        </div>
    );
}

/** A form-level message (server error, missing token). */
export function FormAlert({ children }: { children: React.ReactNode }) {
    return (
        <div role="alert" className="mb-8 flex items-start gap-3 border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium leading-relaxed text-primary-light">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{children}</span>
        </div>
    );
}

export function FormHeading({ title, lede }: { title: React.ReactNode; lede?: React.ReactNode }) {
    return (
        <div className="mb-10">
            <h1 className="text-balance text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">{title}</h1>
            {lede && <p className="mt-3 max-w-[44ch] text-pretty leading-relaxed text-white/70">{lede}</p>}
        </div>
    );
}
