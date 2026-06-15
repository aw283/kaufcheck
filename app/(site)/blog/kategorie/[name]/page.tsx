import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCard } from "@/components/blog-card";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  getPostsByCategory,
  type Category,
} from "@/lib/blog";

export function generateStaticParams() {
  return CATEGORIES.map((name) => ({ name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  if (!CATEGORIES.includes(name as Category)) return {};
  const label = CATEGORY_LABEL[name as Category];
  return {
    title: `${label} – Ratgeber`,
    description: `Alle immoampel-Artikel in der Kategorie ${label}.`,
    alternates: { canonical: `/blog/kategorie/${name}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  if (!CATEGORIES.includes(name as Category)) notFound();
  const cat = name as Category;
  const posts = getPostsByCategory(cat);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
      <p className="text-sm text-muted-foreground">
        <Link href="/blog" className="hover:underline">
          Ratgeber
        </Link>{" "}
        / {CATEGORY_LABEL[cat]}
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl">{CATEGORY_LABEL[cat]}</h1>

      {posts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Hier erscheinen bald Artikel.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
