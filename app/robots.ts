import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://wohnkredit-check.at";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/datenschutz", "/impressum"],
        disallow: ["/api/", "/check", "/lead"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
