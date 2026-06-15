import Link from "next/link";

import { CATEGORY_LABEL, type Post } from "@/lib/blog";

export function CategoryPill({ category }: { category: Post["category"] }) {
  return (
    <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-primary">
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function BlogCard({ post }: { post: Post }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border bg-surface p-5 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <CategoryPill category={post.category} />
        <span className="text-xs text-muted-foreground">
          {post.readingMinutes} Min Lesezeit
        </span>
      </div>
      <h3 className="font-serif text-xl leading-snug">
        <Link
          href={`/blog/${post.slug}`}
          className="after:absolute after:inset-0 group-hover:underline"
        >
          {post.title}
        </Link>
      </h3>
      <p className="line-clamp-3 text-sm text-muted-foreground">
        {post.description}
      </p>
      <time
        dateTime={post.publishedAt}
        className="mt-auto text-xs text-muted-foreground"
      >
        {new Date(post.publishedAt).toLocaleDateString("de-AT", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </article>
  );
}
