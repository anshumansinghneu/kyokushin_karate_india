import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Legacy palette, now CSS variables (globals.css): the member app keeps its red on
                // black (.skin-app), the public site maps the same classes onto the dojo palette.
                background: "#000000",
                // Ink black on the public site (globals.css --c-black), pure black in the member app.
                black: "rgb(var(--c-black) / <alpha-value>)",
                foreground: "rgb(var(--c-white) / <alpha-value>)",
                white: "rgb(var(--c-white) / <alpha-value>)",
                primary: {
                    DEFAULT: "rgb(var(--c-primary) / <alpha-value>)",
                    dark: "rgb(var(--c-primary-dark) / <alpha-value>)",
                    light: "rgb(var(--c-primary-light) / <alpha-value>)",
                },
                secondary: {
                    DEFAULT: "rgb(var(--c-secondary) / <alpha-value>)",
                    dark: "rgb(var(--c-secondary-dark) / <alpha-value>)",
                    light: "rgb(var(--c-secondary-light) / <alpha-value>)",
                },
                red: {
                    50: "#fef2f2",
                    100: "#fee2e2",
                    200: "#fecaca",
                    300: "rgb(var(--c-red-300) / <alpha-value>)",
                    400: "rgb(var(--c-red-400) / <alpha-value>)",
                    500: "rgb(var(--c-red-500) / <alpha-value>)",
                    600: "rgb(var(--c-red-600) / <alpha-value>)",
                    700: "rgb(var(--c-red-700) / <alpha-value>)",
                    800: "rgb(var(--c-red-800) / <alpha-value>)",
                    900: "rgb(var(--c-red-900) / <alpha-value>)",
                    950: "#450a0a",
                },
                surface: {
                    DEFAULT: "#111111",
                    hover: "#1A1A1A",
                    active: "#222222",
                },
                muted: "#666666",
                border: "#333333",
                // Homepage scroll film: the dojo before dawn (KKFI_REDESIGN.md, 4.3)
                night: "#000000",
                canvas: "#E8E2D4",
                ash: "#8F887B",
                "worn-belt": "#26221E",
                "dan-gold": "#B89A5A",
                "kyokushin-red": "#B3261E",
            },
            fontFamily: {
                sans: ['var(--font-body)', 'sans-serif'],
                mincho: ['var(--font-mincho)', 'serif'],
                gothic: ['var(--font-gothic)', 'sans-serif'],
            },
            transitionTimingFunction: {
                dojo: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'blob': 'blob 7s infinite',
                'shimmer': 'shimmer 4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                blob: {
                    "0%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                    "33%": {
                        transform: "translate(30px, -50px) scale(1.1)",
                    },
                    "66%": {
                        transform: "translate(-20px, 20px) scale(0.9)",
                    },
                    "100%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                },
            },
        },
    },
    plugins: [],
};
export default config;
