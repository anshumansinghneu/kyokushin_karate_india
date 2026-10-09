import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "@/components/brand/Reveal";
import BrandLink from "@/components/brand/BrandLink";
import SceneSlot from "@/components/three/SceneSlot";

/*
 * Long-form reading kit for the Dojo Chronicles: the article opener, the prose
 * measure, pull quotes, the closing call and the "keep reading" list. Shared by
 * the four written guides and the CMS posts at /blog/[slug].
 */

/**
 * Typography for article bodies, including CMS HTML we do not control. Written
 * as descendant variants because the project has no typography plugin.
 * Measure ~68ch, 1.75 leading for light-on-dark reading.
 */
// Joined by hand, not cn(): tailwind-merge can mistake text-[clamp()] sizes for colours and drop them.
export const PROSE = [
    "max-w-[68ch] text-pretty text-[1.0625rem] leading-[1.75] text-white/80 md:text-lg",
    "[&_p]:my-6 [&_p:first-child]:mt-0",
    "[&_h2]:mt-16 [&_h2]:mb-5 [&_h2]:text-balance [&_h2]:text-[clamp(1.6rem,3vw,2.15rem)] [&_h2]:font-extrabold [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.015em] [&_h2]:text-white",
    "[&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-white",
    "[&_h4]:mt-8 [&_h4]:mb-2 [&_h4]:font-bold [&_h4]:text-white",
    "[&_strong]:font-semibold [&_strong]:text-white [&_b]:font-semibold [&_b]:text-white [&_em]:text-white/90",
    "[&_a]:font-semibold [&_a]:text-white [&_a]:underline [&_a]:decoration-primary [&_a]:decoration-2 [&_a]:underline-offset-4 hover:[&_a]:text-primary-light",
    "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-6 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2.5 [&_ol]:pl-6 [&_li]:pl-1 [&_li::marker]:text-white/40",
    "[&_blockquote]:my-12 [&_blockquote]:border-t [&_blockquote]:border-white/15 [&_blockquote]:pt-8 [&_blockquote]:text-[clamp(1.3rem,2.6vw,1.75rem)] [&_blockquote]:font-extrabold [&_blockquote]:leading-snug [&_blockquote]:text-white",
    "[&_hr]:my-14 [&_hr]:border-white/10",
    "[&_img]:my-10 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-lg",
    "[&_figure]:my-12 [&_figcaption]:mt-3 [&_figcaption]:text-sm [&_figcaption]:text-white/55",
    "[&_table]:my-10 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-base [&_th]:border-b [&_th]:border-white/20 [&_th]:py-3 [&_th]:pr-4 [&_th]:text-sm [&_th]:font-semibold [&_th]:text-white/60 [&_td]:border-b [&_td]:border-white/10 [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top",
    "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-white",
].join(" ");

interface ArticleHeroProps {
    title: React.ReactNode;
    /** One line under the title. */
    subtitle?: React.ReactNode;
    /** Category label, shown once beside the back link. */
    category?: string;
    /** Date, author, reading time. */
    meta?: React.ReactNode;
    image?: string | null;
    imageAlt?: string;
    /** Character brushed into the ink beside the title. */
    kanji?: string;
}

/**
 * Article opener. Full bleed under the navbar (data-bleed). With a photograph
 * the title sits on it; without one, the title carries the page alone.
 */
export function ArticleHero({ title, subtitle, category, meta, image, imageAlt = "", kanji = "道" }: ArticleHeroProps) {
    return (
        <header data-bleed className={cn("relative flex overflow-hidden", image ? "min-h-[82svh]" : "min-h-[64svh]")}>
            {/* Ink scene: the cover photo surfaces through the ink, the character floats beside the title.
                The poster (photo, or plain black) is what static-tier and first-paint visitors see. */}
            <SceneSlot
                scene="ink"
                sceneProps={{ imageUrl: image ?? undefined, kanji, red: 0.25 }}
                className="absolute inset-0"
                fallback={
                    image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover object-[50%_28%] grayscale-[0.3]" />
                    ) : (
                        <div className="absolute inset-0 bg-black" />
                    )
                }
            />
            {image && <span className="sr-only">{imageAlt}</span>}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,5rem)] pt-36 sm:px-6 md:pt-44 lg:px-8">
                <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-white/70">
                    <Link href="/blog" className="group inline-flex min-h-11 items-center gap-2 text-white/80 transition-colors hover:text-white">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                        Dojo chronicles
                    </Link>
                    {category && (
                        <>
                            <span aria-hidden="true" className="text-white/30">/</span>
                            <span>{category}</span>
                        </>
                    )}
                </p>
                <h1 className="max-w-[22ch] text-balance text-[clamp(2.4rem,5.6vw,4.5rem)] font-black leading-[1] tracking-[-0.03em] text-white">
                    {title}
                </h1>
                {subtitle && <p className="mt-5 max-w-[48ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">{subtitle}</p>}
                {meta && <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/65">{meta}</div>}
            </div>
        </header>
    );
}

/** The reading column. Sits slightly left of centre on wide screens, like a book page. */
export function ArticleBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("mx-auto max-w-[1100px] px-4 pb-8 pt-[clamp(3rem,7vw,5rem)] sm:px-6 lg:px-8", className)}>
            <div className={PROSE}>{children}</div>
        </div>
    );
}

/** Opening paragraph, set a size up. */
export function Lede({ children }: { children: React.ReactNode }) {
    return <p className="!mt-0 text-[1.25rem] leading-[1.6] text-white md:text-[1.4rem]">{children}</p>;
}

/** A spoken line, set large between rules. Not italic: weight carries it. */
export function PullQuote({ children, cite }: { children: React.ReactNode; cite: string }) {
    return (
        <figure className="!my-14 border-y border-white/15 py-10">
            <blockquote className="!my-0 !border-0 !pt-0 text-balance text-[clamp(1.4rem,2.8vw,1.9rem)] font-extrabold leading-snug text-white">
                {children}
            </blockquote>
            <figcaption className="!mt-5 text-sm font-semibold text-white/60">{cite}</figcaption>
        </figure>
    );
}

/** The closing ask: a heading, a sentence, and one primary action. */
export function ArticleCta({ title, body, actions }: { title: string; body: string; actions: { href: string; label: string; primary?: boolean }[] }) {
    return (
        <section className="mx-auto max-w-[1100px] px-4 py-[clamp(3rem,7vw,5rem)] sm:px-6 lg:px-8">
            <Reveal className="border-t border-white/15 pt-12">
                <h2 className="max-w-[20ch] text-balance text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
                    {title}
                    <span className="text-primary">.</span>
                </h2>
                <p className="mt-5 max-w-[56ch] text-pretty text-lg leading-relaxed text-white/75">{body}</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    {actions.map((a) => (
                        <BrandLink key={a.href} href={a.href} variant={a.primary ? "primary" : "outline"}>
                            {a.label}
                            {a.primary && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                        </BrandLink>
                    ))}
                </div>
            </Reveal>
        </section>
    );
}

/** "Keep reading": an editorial list, not a card grid. */
export function KeepReading({ links }: { links: { href: string; title: string; note?: string }[] }) {
    return (
        <nav aria-label="Keep reading" className="mx-auto max-w-[1100px] px-4 pb-[clamp(4rem,9vw,7rem)] sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold text-white/60">Keep reading</h2>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {links.map((l) => (
                    <li key={l.href}>
                        <Link href={l.href} className="group grid items-baseline gap-1 py-5 sm:grid-cols-[1fr_auto] sm:gap-8">
                            <span className="text-lg font-bold text-white transition-colors group-hover:text-primary-light md:text-xl">{l.title}</span>
                            <span className="flex items-center gap-2 text-sm text-white/55">
                                {l.note}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

/** The four written guides, used by the index and by each guide's reading list. */
export const GUIDES = [
    {
        slug: "kyokushin-vs-shotokan",
        title: "What Makes Kyokushin Different from Shotokan?",
        excerpt: "Discover the key differences between Kyokushin and Shotokan karate — full-contact sparring, conditioning, and the spirit of Osu!",
        category: "Karate Knowledge",
        date: "February 13, 2026",
        image: "/gallery/DSC08737.JPG",
        imageAlt: "Two black-belt karateka exchange strikes in full-contact kumite",
    },
    {
        slug: "full-contact-training-youth-benefits",
        title: "The Benefits of Full-Contact Training for Youth",
        excerpt: "Why parents across India are choosing Kyokushin for their children — confidence, discipline, anti-bullying resilience & fitness.",
        category: "Youth Development",
        date: "February 13, 2026",
        image: "/gallery/DSC08784.JPG",
        imageAlt: "Two young karateka in headgear and chest guards spar under a referee",
    },
    {
        slug: "history-kyokushin-india",
        title: "History of Kyokushin in India: From Sosai Oyama to Today",
        excerpt: "The complete journey of Kyokushin Karate from Japan to India — from Sosai Oyama to KKFI under Shihan Vasant Kumar Singh.",
        category: "Our Heritage",
        date: "February 13, 2026",
        image: "/history/oyama.jpg",
        imageAlt: "Sosai Masutatsu Oyama, seated in his gi",
    },
    {
        slug: "kyokushin-grading-syllabus-2026",
        title: "Kyokushin Grading Syllabus 2026: Complete Belt Guide",
        excerpt: "Complete belt rank guide from white to black belt — kata requirements, kumite expectations & promotion criteria.",
        category: "Official Syllabus",
        date: "February 13, 2026",
        image: "/history/belt-grip.jpg",
        imageAlt: "Hands gripping a black belt tied over a dark gi",
    },
] as const;

export const AUTHOR = "Kyokushin Karate Foundation of India";
