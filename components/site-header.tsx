"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/check", label: "Leistbarkeits-Check" },
  { href: "/bautraeger", label: "Für Bauträger" },
  { href: "/foerderungen", label: "Förderungen" },
  { href: "/blog", label: "Ratgeber" },
  { href: "/zinsen", label: "Zinsen" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Zum Inhalt springen
      </a>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <BrandLogo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname?.startsWith(item.href) && "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm">
            <Link href="/check">Leistbarkeit prüfen</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 hover:bg-muted md:hidden"
          aria-expanded={open}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          className="border-t bg-background px-5 pb-5 pt-2 md:hidden"
          aria-label="Mobile Navigation"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button asChild className="w-full" onClick={() => setOpen(false)}>
                <Link href="/check">Leistbarkeit prüfen</Link>
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
