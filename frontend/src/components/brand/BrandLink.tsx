import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The one CTA shape for public pages, in the dojo system: primary is unbleached
 * canvas on black, the secondary is quiet text that takes a dan-gold underline.
 * Sentence case, 48px tall. Matches the homepage FilmLink.
 */
export default function BrandLink({
    href,
    variant = "primary",
    className,
    children,
}: {
    href: string;
    variant?: "primary" | "outline";
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "group inline-flex min-h-12 items-center justify-center gap-2 rounded-none font-gothic text-base font-bold transition-colors duration-500 ease-dojo",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dan-gold",
                variant === "primary"
                    ? "bg-canvas px-7 text-night hover:bg-dan-gold"
                    : "px-1 text-canvas underline decoration-transparent decoration-1 underline-offset-[6px] hover:decoration-dan-gold",
                className,
            )}
        >
            {children}
        </Link>
    );
}
