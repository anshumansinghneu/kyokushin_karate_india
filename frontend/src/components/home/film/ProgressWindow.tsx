"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFilm, useFilmFrame } from "./FilmContext";
import { windowAlpha } from "./geometry";

/**
 * Text over a film, visible only inside a window of scroll progress. Opacity
 * follows the scroll, never a timer; once it fades out it is hidden and inert,
 * so its links leave the tab order.
 */
export default function ProgressWindow({
    show,
    fade = 0.03,
    as: Tag = "div",
    className,
    children,
}: {
    show: [number, number];
    fade?: number;
    /** span when it sits inside running text. */
    as?: "div" | "span";
    className?: string;
    children: ReactNode;
}) {
    const { reduced } = useFilm();
    const ref = useRef<HTMLElement>(null);
    const initial = windowAlpha(0, show, fade);

    useFilmFrame(({ p }) => {
        const el = ref.current;
        if (!el) return;
        const a = reduced ? 1 : windowAlpha(p, show, fade);
        el.style.opacity = String(a);
        el.style.visibility = a > 0 ? "visible" : "hidden";
        el.inert = a < 0.5;
    });

    return (
        <Tag
            ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>}
            className={cn("absolute inset-0 z-10", className)}
            style={{ opacity: initial, visibility: initial > 0 ? "visible" : "hidden" }}
        >
            {children}
        </Tag>
    );
}
