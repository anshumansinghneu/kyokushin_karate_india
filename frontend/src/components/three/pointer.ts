/*
 * Viewport-normalised pointer (-1..1, y up), shared by every scene. The canvas
 * ignores pointer events so the DOM above it stays fully interactive; scenes
 * read this instead of R3F's per-view pointer.
 */
export const pointer = { x: 0, y: 0 };

let users = 0;

function onMove(e: PointerEvent) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
}

export function startPointerTracking() {
    users += 1;
    if (users === 1) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
        users -= 1;
        if (users === 0) window.removeEventListener("pointermove", onMove);
    };
}
