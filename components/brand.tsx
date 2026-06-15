import Link from "next/link";

import { cn } from "@/lib/utils";

/** Ampel-Mark als Inline-SVG — skaliert sauber, erbt keine Fontprobleme. */
export function AmpelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6", className)}
      aria-hidden
      fill="none"
    >
      <rect x="2" y="0" width="8" height="8" rx="2" fill="#DC2626" />
      <rect x="8" y="8" width="8" height="8" rx="2" fill="#F59E0B" />
      <rect x="14" y="16" width="8" height="8" rx="2" fill="#047857" />
    </svg>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2", className)}
      aria-label="immoampel – Startseite"
    >
      <AmpelMark />
      <span className="font-serif text-xl leading-none">immoampel</span>
    </Link>
  );
}
