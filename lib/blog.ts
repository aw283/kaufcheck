// Blog-Datenzugriff. Läuft nur server-side (fs).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";

export const CATEGORIES = [
  "ratgeber",
  "erklaerung",
  "foerderung",
  "vergleich",
  "marktdaten",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  ratgeber: "Ratgeber",
  erklaerung: "Erklärung",
  foerderung: "Förderung",
  vergleich: "Vergleich",
  marktdaten: "Marktdaten",
};

const frontmatterSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category: z.enum(CATEGORIES),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  author: z.string().default("immoampel Redaktion"),
  coverImage: z.string().optional(),
  draft: z.boolean().optional(),
});

export interface Post {
  slug: string;
  title: string;
  description: string;
  category: Category;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  readingMinutes: number;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readPost(file: string): Post | null {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`[blog] Ungültiges Frontmatter in ${file}:`, parsed.error.message);
    return null;
  }
  if (parsed.data.draft) return null;
  return {
    slug,
    ...parsed.data,
    author: parsed.data.author,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    content,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(readPost)
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const safe = slug.replace(/[^a-z0-9-]/g, "");
  const file = path.join(BLOG_DIR, `${safe}.mdx`);
  if (!fs.existsSync(file)) return null;
  return readPost(`${safe}.mdx`);
}

export function getPostsByCategory(cat: Category): Post[] {
  return getAllPosts().filter((p) => p.category === cat);
}

export function getRelatedPosts(slug: string, n = 3): Post[] {
  const current = getPostBySlug(slug);
  if (!current) return [];
  const all = getAllPosts().filter((p) => p.slug !== slug);
  const sameCat = all.filter((p) => p.category === current.category);
  const rest = all.filter((p) => p.category !== current.category);
  return [...sameCat, ...rest].slice(0, n);
}

/** H2/H3-Überschriften für die ToC extrahieren (gleiche Slug-Logik wie rehype-slug). */
export function extractToc(content: string): { id: string; text: string; level: 2 | 3 }[] {
  const out: { id: string; text: string; level: 2 | 3 }[] = [];
  for (const line of content.split("\n")) {
    const m = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    out.push({ id, text, level: m[1] === "##" ? 2 : 3 });
  }
  return out;
}
