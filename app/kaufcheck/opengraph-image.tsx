import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "ImmoScout Kaufcheck – Welche Immobilie kann ich mir leisten?";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(135deg, #FFF5EC 0%, #FFFFFF 55%, #FFE5CC 100%)",
          fontFamily: "sans-serif",
          color: "#1A1A1A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#FF6600",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            €
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
            ImmoScout · Kaufcheck
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "#FF6600",
              color: "#FFFFFF",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Leistbarkeit in 3 Minuten
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 960,
            }}
          >
            Welche Immobilie kann ich mir leisten?
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#4B4B4B",
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Kostenlos, ohne Registrierung, auf Basis der österreichischen
            KIM-V-Richtlinien.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#6B6B6B",
          }}
        >
          <div>kaufcheck.immobilienscout24.at</div>
          <div style={{ display: "flex", gap: 24 }}>
            <span>✓ Keine Registrierung</span>
            <span>✓ Keine Daten­speicherung</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
