import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://wohnkredit-check.at";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wohnkredit-Check – Welche Immobilie kann ich mir leisten?",
    template: "%s | Wohnkredit-Check",
  },
  description:
    "Kostenloser Leistbarkeits-Check für Ihre Wunschimmobilie in Österreich. In 2 Minuten Klarheit – KIM-V-konform, ohne Registrierung.",
  applicationName: "Wohnkredit-Check",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_AT",
    siteName: "Wohnkredit-Check",
    title: "Welche Immobilie kann ich mir leisten?",
    description:
      "In 2 Minuten Klarheit über Ihr Budget. Kostenlos. Ohne Registrierung.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F4C81",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
