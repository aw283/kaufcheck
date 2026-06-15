import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://immoampel.at";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "immoampel – Welche Immobilie kann ich mir leisten?",
    template: "%s | immoampel",
  },
  description:
    "Klare Ansage statt Bank-Geblubber: Leistbarkeits-Check für Immobilien in Österreich. KIM-V-konform, kostenlos, ohne Registrierung.",
  applicationName: "immoampel",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_AT",
    siteName: "immoampel",
    title: "immoampel – Welche Immobilie kann ich mir leisten?",
    description:
      "Klare Ansage statt Bank-Geblubber. In 2 Minuten Klarheit über Ihr Budget.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a8a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
