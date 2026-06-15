import type { Metadata } from "next";
import Link from "next/link";

import { BlogCard } from "@/components/blog-card";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  getAllPosts,
  type Category,
} from "@/lib/blog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ratgeber – Immobilien, Finanzierung & Förderungen",
  description:
    "Verständliche Artikel zu Leistbarkeit, KIM-V, Eigenkapital und Wohnbauförderung in Österreich. Ohne Bank-Geblubber.",
  alternates: { canonical: "/blog" },
};

const PER_PAGE = 12;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategorie?: string; seite?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const cat = CATEGORIES.includes(sp.kategorie as Category)
    ? (sp.kategorie as Category)
    : null;
  const page = Math.max(1, Number(sp.seite) || 1);

  let posts = getAllPosts();
  if (cat) posts = posts.filter((p) => p.category === cat);
  if (q) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const visible = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-4xl sm:text-5xl">Ratgeber</h1>
        <p className="mt-3 text-muted-foreground">
          Leistbarkeit, Finanzierung, Förderungen — erklärt, wie wir es selbst
          gern gelesen hätten.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link
          href="/blog"
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            !cat ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Alle
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/blog?kategorie=${c}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {CATEGORY_LABEL[c]}
          </Link>
        ))}
        <form action="/blog" className="ml-auto">
          {cat ? <input type="hidden" name="kategorie" value={cat} /> : null}
          <label htmlFor="blog-q" className="sr-only">
            Artikel durchsuchen
          </label>
          <input
            id="blog-q"
            name="q"
            defaultValue={q}
            placeholder="Suchen …"
            className="w-44 rounded-full border bg-surface px-4 py-1.5 text-sm"
          />
        </form>
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          Keine Artikel gefunden.{" "}
          <Link href="/blog" className="text-primary underline">
            Filter zurücksetzen
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={`/blog?seite=${page - 1}${cat ? `&kategorie=${cat}` : ""}`}
              className="hover:underline"
            >
              ← Neuere
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            Seite {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/blog?seite=${page + 1}${cat ? `&kategorie=${cat}` : ""}`}
              className="hover:underline"
            >
              Ältere →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
