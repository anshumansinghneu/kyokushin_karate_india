/*
 * Shared classes for the quiet sections around the films (KKFI_REDESIGN.md, 4.3):
 * left-aligned, sentence case, Mincho for display, Zen Kaku Gothic for reading.
 */

export const section = "bg-night px-4 py-[clamp(5rem,11vw,9rem)] md:px-10";
export const wrap = "mx-auto w-full max-w-[1400px]";
export const h2 = "font-mincho text-[clamp(2rem,4vw,3.052rem)] font-extrabold leading-[1.1] tracking-[-0.01em] text-canvas";
export const body = "max-w-[62ch] font-gothic text-base leading-[1.6] text-ash";
export const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dan-gold";
/** A title that takes a dan-gold underline when its panel link is hovered or focused. */
export const panelTitle =
    "underline decoration-transparent decoration-1 underline-offset-[10px] transition-[text-decoration-color] duration-500 ease-dojo group-hover:decoration-dan-gold group-focus-visible:decoration-dan-gold";
