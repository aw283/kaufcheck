import { ImageResponse } from "next/og";

import { getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "immoampel Ratgeber";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "immoampel Ratgeber";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#1e3a8a",
          color: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "#fca5a5" }} />
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "#fcd34d", marginLeft: 14 }} />
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "#6ee7b7", marginLeft: 28 }} />
          </div>
          <div style={{ fontSize: 36 }}>immoampel · Ratgeber</div>
        </div>

        <div style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 1000 }}>
          {title}
        </div>

        <div
          style={{
            fontSize: 22,
            opacity: 0.85,
            fontFamily: "Arial, sans-serif",
          }}
        >
          immoampel.at/blog
        </div>
      </div>
    ),
    size
  );
}
