import type { Metadata } from "next";

const TITLE = "Kaufcheck – Immobilie leistbar? | ImmoScout Österreich";
const DESCRIPTION =
  "Kostenloser Leistbarkeits-Check für Immobilien in Österreich. In 3 Minuten Klarheit über Ihr Kaufbudget – basierend auf den KIM-V-Richtlinien. Keine Registrierung, keine Datenspeicherung.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kaufcheck.immobilienscout24.at"
  ),
  title: {
    default: TITLE,
    template: "%s | ImmoScout Kaufcheck",
  },
  description: DESCRIPTION,
  applicationName: "ImmoScout Kaufcheck",
  keywords: [
    "Immobilien leistbar",
    "Kaufcheck",
    "ImmobilienScout24 Österreich",
    "Wohnkredit",
    "KIM-V",
    "Leistbarkeitsrechner",
    "Eigenheim Budget",
    "Immobilienfinanzierung",
  ],
  alternates: {
    canonical: "/kaufcheck",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    locale: "de_AT",
    url: "/kaufcheck",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "ImmoScout Kaufcheck",
    images: [
      {
        url: "/kaufcheck/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ImmoScout Kaufcheck – Welche Immobilie kann ich mir leisten?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/kaufcheck/opengraph-image"],
  },
  category: "finance",
};

export default function KaufcheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
