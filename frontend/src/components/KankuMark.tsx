/**
 * Kanku Mark — The iconic Kyokushin symbol.
 * Use as watermark (opacity-5), decorative element, or badge.
 */
export default function KankuMark({ className = "w-32 h-32", color = "currentColor" }: { className?: string; color?: string }) {
    return (
        <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
            {/* Outer circle */}
            <circle cx="100" cy="100" r="95" stroke={color} strokeWidth="2.5" opacity="0.6" />
            {/* Inner thick segments (the Kanku "petals") */}
            <path d="M100 5 C100 5 115 60 100 100 C85 60 100 5 100 5Z" fill={color} opacity="0.9" />
            <path d="M195 100 C195 100 140 115 100 100 C140 85 195 100 195 100Z" fill={color} opacity="0.9" />
            <path d="M100 195 C100 195 85 140 100 100 C115 140 100 195 100 195Z" fill={color} opacity="0.9" />
            <path d="M5 100 C5 100 60 85 100 100 C60 115 5 100 5 100Z" fill={color} opacity="0.9" />
            {/* Diagonal petals */}
            <path d="M167 33 C167 33 130 75 100 100 C110 63 167 33 167 33Z" fill={color} opacity="0.5" />
            <path d="M167 167 C167 167 125 130 100 100 C137 110 167 167 167 167Z" fill={color} opacity="0.5" />
            <path d="M33 167 C33 167 70 125 100 100 C90 137 33 167 33 167Z" fill={color} opacity="0.5" />
            <path d="M33 33 C33 33 75 70 100 100 C63 90 33 33 33 33Z" fill={color} opacity="0.5" />
            {/* Center circle */}
            <circle cx="100" cy="100" r="12" fill={color} opacity="0.8" />
        </svg>
    );
}
