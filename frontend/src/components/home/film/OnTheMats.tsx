import FilmLink from "./FilmLink";
import { focusRing, h2, section, wrap } from "./ui";

// Real photographs from KKFI tournaments, in public/gallery-thumbs (720×405 each).
const PHOTOS: string[] = [
    "Two young fighters in red and blue headgear grapple during a bout",
    "A referee watches two fighters in body protectors",
    "A referee stands between two fighters in headgear",
    "A referee steps in as two fighters clinch at a tournament",
    "A young fighter in headgear faces an opponent while the referee watches",
    "A referee separates two brown belts as the judges look on",
    "Two fighters exchange kicks on the tournament mat",
    "Two fighters close in beside the judges' table",
    "A fighter wearing number 265 waits at the edge of the mat",
    "A fighter kneels before the judges' table",
    "A young fighter in a white gi looks across the arena",
    "Two fighters clash in the centre of the ring",
    "Two black belts square off as the crowd watches",
    "Two fighters grapple, one wearing number 230",
    "Two children in headgear and vests face each other before a bout",
    "A referee stands between two young fighters at the end of a bout",
];

/** One row of real photos at their natural shape. Native scrolling with snap; nothing moves on its own. */
export default function OnTheMats() {
    return (
        <section aria-labelledby="mats-heading" className={`${section} px-0 md:px-0`}>
            <div className={`${wrap} flex flex-wrap items-end justify-between gap-4 px-4 md:px-10`}>
                <h2 id="mats-heading" className={h2}>On the mats.</h2>
                <FilmLink href="/gallery" variant="quiet">Open the gallery</FilmLink>
            </div>
            <ul
                tabIndex={0}
                aria-label="Photographs from KKFI tournaments"
                className={`mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 md:scroll-px-10 md:px-10 ${focusRing}`}
            >
                {PHOTOS.map((alt, i) => (
                    <li key={i} className="shrink-0 snap-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/gallery-thumbs/ring-${String(i + 1).padStart(2, "0")}.jpg`}
                            alt={alt}
                            width={720}
                            height={405}
                            loading="lazy"
                            decoding="async"
                            className="h-[clamp(12rem,32vw,22rem)] w-auto"
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
