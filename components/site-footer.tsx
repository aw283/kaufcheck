import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} Wohnkredit-Check</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/datenschutz"
            prefetch={false}
            className="font-medium hover:text-foreground hover:underline"
          >
            Datenschutz
          </Link>
          <span aria-hidden className="opacity-60">·</span>
          <Link
            href="/impressum"
            prefetch={false}
            className="font-medium hover:text-foreground hover:underline"
          >
            Impressum
          </Link>
          <span aria-hidden className="opacity-60">·</span>
          <span>Orientierungswert – keine verbindliche Kreditzusage.</span>
        </nav>
      </div>
    </footer>
  );
}
