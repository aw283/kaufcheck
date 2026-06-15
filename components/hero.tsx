"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const AMPEL = [
  { key: "rot", label: "Noch nicht", color: "var(--error)", hint: "Ehrliche Ansage statt Vertröstung" },
  { key: "gelb", label: "Mit Anpassungen", color: "var(--warning)", hint: "Konkrete Hebel, die wirken" },
  { key: "gruen", label: "Leistbar", color: "var(--success)", hint: "Bis € 356.000 — los geht's" },
] as const;

export function Hero() {
  const reduce = useReducedMotion();
  // grün startet aktiv (positives Framing), läuft dann zyklisch
  const [active, setActive] = useState(2);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % AMPEL.length), 1700);
    return () => clearInterval(id);
  }, [reduce]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="relative overflow-hidden border-b bg-[#0e1b3d] text-white">
      {/* Mesh-Glow Hintergrund */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#2a4cad]/40 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-80 w-80 rounded-full bg-[var(--success)]/15 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[30%] h-72 w-72 rounded-full bg-[var(--warning)]/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur"
          >
            <span className="flex gap-0.5" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-error" />
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="h-2 w-2 rounded-full bg-success" />
            </span>
            Leistbarkeits-Check für Österreich
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-5 text-balance font-serif text-5xl leading-[1.04] sm:text-6xl lg:text-7xl"
          >
            Welche Immobilie können Sie sich leisten?
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-lg text-lg text-white/70"
          >
            Klare Ansage statt Bank-Geblubber: In zwei Minuten wissen Sie, was
            geht — grün, gelb oder rot. Mit denselben Regeln, die Ihre Bank
            anwendet.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="xl"
              className="bg-white px-7 text-base text-[#0e1b3d] shadow-lg shadow-black/20 hover:bg-white/90"
            >
              <Link href="/check">
                Leistbarkeit prüfen
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/25 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="#wie">Wie es funktioniert</Link>
            </Button>
          </motion.div>

          <motion.p variants={item} className="mt-4 text-xs text-white/50">
            Kostenlos · Ohne Registrierung · KIM-V-konform
          </motion.p>
        </motion.div>

        {/* Animierte Ampel-Karte */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <div className="mx-auto w-fit space-y-3 rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {AMPEL.map((r, i) => {
              const on = i === active;
              return (
                <motion.div
                  key={r.key}
                  animate={{
                    scale: on ? 1.03 : 1,
                    opacity: on ? 1 : 0.45,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="flex w-72 items-center gap-4 rounded-2xl px-5 py-4"
                  style={{
                    background: on
                      ? `color-mix(in srgb, ${r.color} 18%, transparent)`
                      : "rgba(255,255,255,0.03)",
                    boxShadow: on
                      ? `0 0 0 1px color-mix(in srgb, ${r.color} 40%, transparent)`
                      : "none",
                  }}
                >
                  <span className="relative flex h-5 w-5 shrink-0">
                    {on && !reduce ? (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ background: r.color }}
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                      />
                    ) : null}
                    <span
                      className="relative inline-flex h-5 w-5 rounded-full"
                      style={{
                        background: r.color,
                        opacity: on ? 1 : 0.35,
                      }}
                    />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold text-white">{r.label}</span>
                    <span className="text-xs text-white/60">{r.hint}</span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
