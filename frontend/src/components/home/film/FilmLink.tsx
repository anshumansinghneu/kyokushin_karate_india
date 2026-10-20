import Link from "next/link";
import { cn } from "@/lib/utils";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dan-gold";

/**
 * The homepage's two link shapes. Solid: unbleached canvas on black, the one
 * action per moment. Quiet: plain text that takes a dan-gold underline.
 * Sentence case, no arrows.
 */
export default function FilmLink({
    href,
    variant = "solid",
    className,
    children,
}: {
    href: string;
    variant?: "solid" | "quiet";
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex min-h-12 items-center font-gothic font-bold transition-colors duration-500 ease-dojo",
                focus,
                variant === "solid"
                    ? "bg-canvas px-7 text-night hover:bg-dan-gold"
                    : "text-canvas underline decoration-transparent decoration-1 underline-offset-[6px] hover:decoration-dan-gold",
                className,
            )}
        >
            {children}
        </Link>
    );
}
