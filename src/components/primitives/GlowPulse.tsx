"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function GlowPulse({
  pulsing = false,
  className = "",
  children,
}: {
  pulsing?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.span
      className={`inline-flex ${className}`}
      animate={
        pulsing
          ? {
              scale: [1, 1.15, 1],
              boxShadow: [
                "0 0 0 0 rgba(255,59,48,0)",
                "0 0 24px 4px var(--interrupt-red-glow)",
                "0 0 0 0 rgba(255,59,48,0)",
              ],
            }
          : { scale: 1, boxShadow: "0 0 0 0 rgba(255,59,48,0)" }
      }
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.span>
  );
}
