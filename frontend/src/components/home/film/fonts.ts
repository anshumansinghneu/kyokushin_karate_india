import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";

// The public site's two faces, loaded in the root layout. Only the Latin slice
// is preloaded; Google splits the Japanese glyphs by unicode-range, so the
// browser fetches just the kanji each page actually shows.
export const mincho = Shippori_Mincho_B1({
    weight: ["500", "800"],
    subsets: ["latin"],
    variable: "--font-mincho",
    display: "swap",
});

export const gothic = Zen_Kaku_Gothic_New({
    weight: ["400", "700"],
    subsets: ["latin"],
    variable: "--font-gothic",
    display: "swap",
});
