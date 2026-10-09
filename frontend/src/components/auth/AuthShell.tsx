"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SceneSlot from "@/components/three/SceneSlot";

// Stable object: SceneSlot re-syncs props by identity.
const SCENE_PROPS = { compact: true };

interface AuthShellProps {
    /** Optimised photograph for the brand side (use /history/*.jpg, never the large PNGs). */
    image: string;
    imageAlt: string;
    /** Brand-side headline, set large on desktop and small in the mobile band. */
    title: React.ReactNode;
    lede?: string;
    /** Form column width: forms with two-up fields need more room. */
    width?: "narrow" | "wide";
    backHref?: string;
    backLabel?: string;
    children: React.ReactNode;
}

/**
 * Shared frame for sign-in, registration and password recovery. Desktop: the
 * homepage's Kanku-in-ink scene with the brand line on the left, the form on
 * the right. Mobile: a short band carrying the same scene, then the form. The
 * photograph is the poster for the static tier and the moment before WebGL
 * loads. Full-bleed under the navbar via data-bleed (no negative margins).
 */
export default function AuthShell({
    image,
    imageAlt,
    title,
    lede,
    width = "narrow",
    backHref = "/",
    backLabel = "Back to the site",
    children,
}: AuthShellProps) {
    return (
        // Transparent on purpose: the brand scene shows through from the canvas behind <main>.
        <div data-bleed className="relative grid min-h-[100svh] text-white selection:bg-primary selection:text-white lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
            {/* Brand side (desktop): the Kanku in ink; copy sits low and quiet. */}
            <aside className="relative hidden overflow-hidden lg:block">
                <SceneSlot
                    scene="home-hero"
                    sceneProps={SCENE_PROPS}
                    className="absolute inset-0"
                    posterAlt={imageAlt}
                    fallback={
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="absolute inset-0 h-full w-full bg-black object-cover opacity-60 grayscale" />
                    }
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-12 pb-16 xl:p-16">
                    <p className="mb-6 flex items-center gap-3 text-sm font-semibold text-white/75">
                        <span lang="ja" className="text-2xl font-black text-primary-light">極真</span>
                        <span>Kyokushin Karate Foundation of India</span>
                    </p>
                    <p className="max-w-[14ch] text-balance text-[clamp(2.75rem,5vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                        {title}
                    </p>
                    {lede && <p className="mt-6 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/75">{lede}</p>}
                </div>
            </aside>

            {/* Form side. */}
            <div className="relative flex flex-col">
                {/* Mobile brand band: short, carrying the same scene, clears the fixed top bar. */}
                <div className="relative h-52 overflow-hidden lg:hidden">
                    <SceneSlot
                        scene="home-hero"
                        sceneProps={SCENE_PROPS}
                        className="absolute inset-0"
                        fallback={
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="absolute inset-0 h-full w-full bg-black object-cover opacity-50 grayscale" />
                        }
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <p className="absolute inset-x-4 bottom-5 text-[2rem] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white sm:inset-x-8">
                        {title}
                    </p>
                </div>

                <div className="flex flex-1 justify-center px-4 pb-32 pt-8 sm:px-8 lg:items-center lg:px-12 lg:pb-16 lg:pt-36">
                    <div className={width === "wide" ? "w-full max-w-xl" : "w-full max-w-md"}>
                        <Link
                            href={backHref}
                            className="group mb-10 hidden min-h-11 items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white lg:inline-flex"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                            {backLabel}
                        </Link>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
