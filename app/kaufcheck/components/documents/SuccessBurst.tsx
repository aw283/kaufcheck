"use client";

import { motion } from "framer-motion";

/**
 * Dezente Partikel-Animation nach erfolgreicher Extraktion.
 * Dauert bewusst < 1 s und besteht nur aus 8 kleinen Dots – kein
 * echtes Konfetti-Lib, keine GPU-Last.
 */
export function SuccessBurst() {
  const particles = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {particles.map((i) => {
        const angle = (i / particles.length) * 2 * Math.PI;
        const distance = 42;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const hue = i % 2 === 0 ? "var(--primary)" : "var(--success)";
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1, 1, 0.4],
              x: [0, x * 0.6, x],
              y: [0, y * 0.6, y],
            }}
            transition={{
              duration: 0.9,
              times: [0, 0.2, 0.7, 1],
              ease: "easeOut",
              delay: i * 0.015,
            }}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ background: hue }}
          />
        );
      })}
    </div>
  );
}
