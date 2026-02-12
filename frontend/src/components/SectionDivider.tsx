/** Decorative Japanese-inspired brush-stroke divider between homepage sections */
export default function SectionDivider({ flip = false }: { flip?: boolean }) {
    return (
        <div className={`relative w-full h-16 md:h-24 overflow-hidden select-none pointer-events-none ${flip ? "rotate-180" : ""}`}>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-600/40 ring-4 ring-red-600/10" />
            {/* Left brush line */}
            <div className="absolute top-1/2 left-[10%] right-[52%] -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent to-red-600/20 rounded-full" />
            {/* Right brush line */}
            <div className="absolute top-1/2 left-[52%] right-[10%] -translate-y-1/2 h-[2px] bg-gradient-to-l from-transparent to-red-600/20 rounded-full" />
        </div>
    );
}
