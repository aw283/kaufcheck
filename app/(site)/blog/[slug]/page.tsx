import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { ChevronLeft } from "lucide-react";

import { BlogCard, CategoryPill } from "@/components/blog-card";
import {
  extractToc,
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
    },
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://immoampel.at";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const toc = extractToc(post.content).filter((t) => t.level === 2);
  const related = getRelatedPosts(slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "immoampel", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Alle Artikel
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_260px]">
        <article>
          <header className="max-w-2xl">
            <div className="flex items-center gap-3">
              <CategoryPill category={post.category} />
              <span className="text-xs text-muted-foreground">
                {post.readingMinutes} Min Lesezeit
              </span>
            </div>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {post.description}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {post.author} ·{" "}
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("de-AT", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
          </header>

          <div className="prose prose-neutral mt-10 max-w-2xl">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  rehypePlugins: [
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: "wrap" }],
                  ],
                },
              }}
            />
          </div>

          <footer className="mt-12 max-w-2xl rounded-xl border bg-accent/50 p-6">
            <p className="font-serif text-2xl">
              Wissen, was wirklich leistbar ist?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Der immoampel-Check rechnet Ihre Situation in zwei Minuten durch —
              kostenlos, ohne Registrierung.
            </p>
            <Link
              href="/check"
              className="mt-4 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Leistbarkeit prüfen
            </Link>
          </footer>
        </article>

        {toc.length > 1 ? (
          <aside className="hidden lg:block">
            <nav
              aria-label="Inhaltsverzeichnis"
              className="sticky top-24 rounded-xl border bg-surface p-5"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Inhalt
              </p>
              <ul className="space-y-2 text-sm">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl">Weiterlesen</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
