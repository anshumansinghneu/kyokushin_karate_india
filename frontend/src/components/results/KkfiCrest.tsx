"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The official KKFI emblem with a soft red glow halo.
 * Used as the brand anchor across the Belt Test Results pages.
 */
export default function KkfiCrest({
  size = 104,
  className = "",
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <>
          <span className="absolute inset-0 -z-10 rounded-full bg-red-600/25 blur-2xl" />
          <span className="absolute inset-[-18%] -z-10 rounded-full border border-red-500/10" />
        </>
      )}
      <motion.div
        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full w-full"
      >
        <Image
          src="/kkfi-logo.png"
          alt="Kyokushin Karate Foundation of India emblem"
          fill
          sizes={`${size}px`}
          priority
          className="object-contain drop-shadow-[0_0_22px_rgba(220,38,38,0.45)]"
        />
      </motion.div>
    </div>
  );
}
