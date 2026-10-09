import { cn } from "@/lib/utils";

type Rhythm = "tight" | "base" | "open";

const RHYTHM: Record<Rhythm, string> = {
    tight: "py-[clamp(3rem,6vw,5rem)]",
    base: "py-[clamp(4rem,9vw,8rem)]",
    open: "py-[clamp(6rem,14vw,12rem)]",
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    rhythm?: Rhythm;
    /** Narrow keeps prose at a readable measure. */
    width?: "narrow" | "base" | "wide";
}

const WIDTH = {
    narrow: "max-w-3xl",
    base: "max-w-6xl",
    wide: "max-w-[1400px]",
};

/** Vertical rhythm and measure for brand pages. Varying `rhythm` between neighbours is the point. */
export default function Section({ rhythm = "base", width = "base", className, children, ...rest }: SectionProps) {
    return (
        <section className={cn("relative px-4 sm:px-6 lg:px-8 brand-section", RHYTHM[rhythm], className)} {...rest}>
            <div className={cn("mx-auto w-full", WIDTH[width])}>{children}</div>
        </section>
    );
}

export function Heading({
    level = 2,
    size = "headline",
    className,
    children,
}: {
    level?: 1 | 2 | 3;
    size?: "display" | "headline" | "title";
    className?: string;
    children: React.ReactNode;
}) {
    const Tag = `h${level}` as const;
    const sizes = {
        display: "text-[clamp(2.75rem,8vw,6rem)] leading-[0.95] tracking-[-0.03em] font-black",
        headline: "text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.02] tracking-[-0.02em] font-extrabold",
        title: "text-xl md:text-2xl leading-tight font-bold",
    };
    return <Tag className={cn("text-balance text-white", sizes[size], className)}>{children}</Tag>;
}
