import { body, section, wrap } from "./ui";

/** The founder and his words. Static: a photograph and a sentence, nothing moves. */
export default function OyamaQuote({ src }: { src?: string }) {
    return (
        <section aria-label="Sosai Masutatsu Oyama" className={section}>
            <div className={`${wrap} grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20`}>
                <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src || "/history/oyama.jpg"}
                        alt="Sosai Masutatsu Oyama in his gi, seated, facing the camera"
                        loading="lazy"
                        decoding="async"
 className="aspect-[4/5] w-full object-cover object-top "
                    />
                    <figcaption className="mt-4 font-gothic text-[0.8rem] text-ash">Sosai Masutatsu Oyama, 1923–1994</figcaption>
                </figure>
                <blockquote>
                    <p className="max-w-[18ch] font-mincho text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-canvas">
                        The heart of our karate is real fighting.
                    </p>
                    <p className={`${body} mt-8 md:text-[1.25rem]`}>
                        There can be no proof without real fighting. Without proof there is no trust. Without trust there is no
                        respect. This is a definition in the world of martial arts.
                    </p>
                    <footer className="mt-6 font-gothic font-bold text-canvas">Sosai Masutatsu Oyama, founder of Kyokushin</footer>
                </blockquote>
            </div>
        </section>
    );
}
