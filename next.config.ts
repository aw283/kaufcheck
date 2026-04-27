import type { NextConfig } from "next";

/**
 * Sicherheits-Header für ALLE Routen.
 *
 * CSP ist bewusst recht streng – falls inline-styles im JSX gebraucht
 * werden (Tailwind-`style`-Attribute), erlauben wir `'unsafe-inline'`
 * für Styles. Inline-Scripts sind weiter blockiert.
 *
 * Production deploys (Vercel) setzen HTTPS automatisch; HSTS forciert
 * es trotzdem für direkte Hits am Edge.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // keine Browser-Sensoren / Mikrofon / Kamera nötig
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Tailwind v4 + Next inline-styles → 'unsafe-inline' für styles
      "style-src 'self' 'unsafe-inline'",
      // Next.js dev/prod inline scripts (hydration). 'strict-dynamic' wäre
      // mit Nonce-Proxy idealer – im MVP halten wir es pragmatisch.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
      // PDF.js Worker wird vom CDN nachgeladen (siehe DocumentThumbnail)
      "worker-src 'self' blob: https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // Next/font lädt Google-Fonts SSR-seitig; im Browser nur eigene Domain
      "connect-src 'self' https://api.anthropic.com https://plausible.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Production-Deploys (Vercel) setzen "X-Powered-By" sonst auf "Next.js"
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Alle Routen
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // API: zusätzlich CORS – nur eigene Domain.
        // CSP/X-Frame etc. werden bereits durch /:path* gesetzt.
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "same-origin" },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Access-Control-Max-Age", value: "600" },
          // Anti-Caching für API-Antworten
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
