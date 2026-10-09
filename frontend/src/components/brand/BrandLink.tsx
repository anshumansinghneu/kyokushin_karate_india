import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The one CTA shape for brand pages: sharp, uppercase, 48px. Red is the primary
 * action only; everything else is the outline.
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
                "group inline-flex min-h-12 items-center justify-center gap-2 rounded-none px-7 text-sm font-bold uppercase tracking-[0.1em] transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98]",
                variant === "primary"
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "border border-white/25 text-white hover:border-white/60 hover:bg-white/10",
                className,
            )}
        >
            {children}
        </Link>
    );
}
