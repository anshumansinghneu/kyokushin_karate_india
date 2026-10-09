import { cn } from "@/lib/utils";

interface PageHeroProps {
    title: React.ReactNode;
    lede?: React.ReactNode;
    /** One deliberate kicker per page at most. Often better left out. */
    kicker?: React.ReactNode;
    actions?: React.ReactNode;
    /** Full-bleed background: a SceneSlot, an image, or nothing. */
    media?: React.ReactNode;
    /** Where the copy sits over the media. */
    align?: "bottom-left" | "center";
    height?: "screen" | "tall" | "compact";
    className?: string;
    children?: React.ReactNode;
}

const HEIGHT = {
    screen: "min-h-[100svh]",
    tall: "min-h-[78svh]",
    compact: "min-h-[52svh]",
};

/**
 * Full-bleed page opener shared by every public page. data-bleed tells <main>
 * to drop its navbar padding (see LayoutShell) so media runs under the bar;
 * the copy restores that space with its own top padding.
 */
export default function PageHero({
    title,
    lede,
    kicker,
    actions,
    media,
    align = "bottom-left",
    height = "tall",
    className,
    children,
}: PageHeroProps) {
    return (
        <header data-bleed className={cn("relative flex overflow-hidden", HEIGHT[height], className)}>
            {media && <div className="absolute inset-0">{media}</div>}
            {/* Legibility scrim: only as strong as the copy needs. */}
            {media && (
                <div
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute inset-0",
                        align === "center"
                            ? "bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),transparent_70%)]"
                            : "bg-gradient-to-t from-black via-black/40 to-transparent",
                    )}
                />
            )}
            <div
                className={cn(
                    "relative z-10 mx-auto flex w-full max-w-[1400px] flex-col px-4 pb-[clamp(3rem,8vh,6rem)] pt-32 sm:px-6 md:pt-44 lg:px-8",
                    align === "center" ? "items-center justify-center text-center" : "justify-end",
                )}
            >
                {kicker && <div className="mb-5 text-sm font-semibold text-white/70">{kicker}</div>}
                <h1 className="max-w-[16ch] text-balance text-[clamp(2.75rem,8vw,6rem)] font-black leading-[0.95] tracking-[-0.03em] text-white">
                    {title}
                </h1>
                {lede && (
                    <p className={cn("mt-6 max-w-[52ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl", align === "center" && "mx-auto")}>
                        {lede}
                    </p>
                )}
                {actions && <div className={cn("mt-9 flex flex-col gap-3 sm:flex-row", align === "center" && "justify-center")}>{actions}</div>}
                {children}
            </div>
        </header>
    );
}
