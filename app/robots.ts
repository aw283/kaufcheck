import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kaufcheck.immobilienscout24.at";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/kaufcheck", "/kaufcheck/datenschutz"],
        disallow: [
          "/api/",
          "/kaufcheck/wizard", // Form-Flow ohne eigenen SEO-Wert
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
