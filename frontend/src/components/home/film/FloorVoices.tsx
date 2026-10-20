import { h2, section, wrap } from "./ui";

interface Voice {
    quote: string;
    name: string;
    belt: string; // sentence case, e.g. "green belt"
    dojo: string;
}

/*
 * Real members only. The old homepage carried placeholder testimonials
 * ("Rahul Sharma, Mumbai Central Dojo"...) that were never real people, and on
 * a page about trust that does more harm than an absent section. Add genuine
 * quotes here, with the member's permission, and the section appears.
 */
const VOICES: Voice[] = [];

/** "From the dojo floor": quiet type, the quote in Mincho, who said it in ash. */
export default function FloorVoices() {
    if (VOICES.length === 0) return null;
    return (
        <section aria-labelledby="voices-heading" className={section}>
            <div className={wrap}>
                <h2 id="voices-heading" className={h2}>From the dojo floor</h2>
                <ul className="mt-14 grid gap-14 md:grid-cols-2 md:gap-x-20">
                    {VOICES.map((v) => (
                        <li key={v.name}>
                            <figure>
                                <blockquote className="max-w-[40ch] font-mincho text-[1.563rem] font-medium leading-[1.4] text-canvas">{v.quote}</blockquote>
                                <figcaption className="mt-5 font-gothic text-ash">
                                    {v.name}, {v.belt}, {v.dojo}
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
