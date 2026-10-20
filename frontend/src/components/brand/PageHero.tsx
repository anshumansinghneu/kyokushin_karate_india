import { cn } from "@/lib/utils";

interface PageHeroProps {
    title: React.ReactNode;
    lede?: React.ReactNode;
    /** One deliberate kicker per page at most. Often better left out. */
    kicker?: React.ReactNode;
    /** The page's kanji, set vertically at the left edge like a hanging scroll (e.g. "帯"). */
    mark?: string;
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
 * Full-bleed page opener shared by every public page, in the dojo system:
 * Mincho title, Gothic lede, an optional vertical kanji mark. data-bleed tells
 * <main> to drop its navbar padding (see LayoutShell) so media runs under the
 * bar; data-nav-solid-after turns the bar solid once the hero has passed.
 */
export default function PageHero({
    title,
    lede,
    kicker,
    mark,
    actions,
    media,
    align = "bottom-left",
    height = "tall",
    className,
    children,
}: PageHeroProps) {
    return (
        <header data-bleed data-nav-solid-after className={cn("relative flex overflow-hidden bg-night", HEIGHT[height], className)}>
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
            {mark && (
                <span
                    aria-hidden="true"
                    lang="ja"
                    className="pointer-events-none absolute left-4 top-24 z-10 font-mincho text-[clamp(2.441rem,5vw,4.5rem)] font-extrabold leading-none text-canvas [writing-mode:vertical-rl] sm:left-6 md:top-32 lg:left-8"
                >
                    {mark}
                </span>
            )}
            <div
                className={cn(
                    "relative z-10 mx-auto flex w-full max-w-[1400px] flex-col px-4 pb-[clamp(3rem,8vh,6rem)] pt-32 sm:px-6 md:pt-44 lg:px-8",
                    mark && align !== "center" && "pl-[calc(1rem+clamp(2.441rem,5vw,4.5rem)+1.5rem)] sm:pl-[calc(1.5rem+clamp(2.441rem,5vw,4.5rem)+1.5rem)] lg:pl-[calc(2rem+clamp(2.441rem,5vw,4.5rem)+2rem)]",
                    align === "center" ? "items-center justify-center text-center" : "justify-end",
                )}
            >
                {kicker && <div className="mb-5 font-gothic text-sm text-ash">{kicker}</div>}
                <h1 className="max-w-[16ch] text-balance font-mincho text-[clamp(2.75rem,8vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-canvas">
                    {title}
                </h1>
                {lede && (
                    <p className={cn("mt-6 max-w-[52ch] text-pretty font-gothic text-base leading-[1.6] text-canvas md:text-[1.25rem]", align === "center" && "mx-auto")}>
                        {lede}
                    </p>
                )}
                {actions && <div className={cn("mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8", align === "center" && "items-center justify-center")}>{actions}</div>}
                {children}
            </div>
        </header>
    );
}
