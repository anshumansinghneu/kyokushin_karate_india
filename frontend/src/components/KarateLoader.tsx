"use client";

import { KANKU_CARDINAL, KANKU_DIAGONAL } from "@/components/KankuMark";

/**
 * The site's loading mark: the Kanku painted stroke by stroke, over and over,
 * like a brush practising the same character. CSS-only so it starts before
 * any JS animation library is ready; reduced motion shows the still mark.
 */
export default function KarateLoader({ label = "Loading" }: { label?: string }) {
    return (
        <div role="status" className="flex flex-col items-center justify-center gap-5">
            <svg viewBox="0 0 200 200" className="kanku-loader h-20 w-20" aria-hidden="true">
                <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="100" cy="100" r="95" strokeWidth="3" strokeOpacity="0.35" pathLength={1} className="kl-ring" />
                    {KANKU_CARDINAL.map((d, i) => (
                        <path key={d} d={d} strokeWidth="5" pathLength={1} className="kl-stroke" style={{ animationDelay: `${i * 0.12}s` }} />
                    ))}
                    {KANKU_DIAGONAL.map((d, i) => (
                        <path key={d} d={d} strokeWidth="3.5" strokeOpacity="0.55" pathLength={1} className="kl-stroke" style={{ animationDelay: `${0.48 + i * 0.1}s` }} />
                    ))}
                </g>
                <circle cx="100" cy="100" r="11" fill="#c00000" className="kl-core" />
            </svg>
            <span className="text-sm font-semibold text-white/60">{label}…</span>
        </div>
    );
}
