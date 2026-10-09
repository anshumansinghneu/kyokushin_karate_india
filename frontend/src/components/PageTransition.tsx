"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function PageTransition({ children, pathname }: { children: React.ReactNode, pathname: string }) {
    return (
        // initial={false}: the first page paints straight from the server HTML
        // instead of waiting for hydration to fade it in. Route changes still animate.
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
