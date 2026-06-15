import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "immoampel – Welche Immobilie können Sie sich leisten?";

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
          padding: "72px 80px",
          background: "#fafaf7",
          color: "#0a0a0a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#DC2626", marginLeft: 0 }} />
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#F59E0B", marginLeft: 16 }} />
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#047857", marginLeft: 32 }} />
          </div>
          <div style={{ fontSize: 40 }}>immoampel</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, maxWidth: 950 }}>
            Welche Immobilie können Sie sich leisten?
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#5d5a52",
              fontFamily: "Arial, sans-serif",
            }}
          >
            Klare Ansage statt Bank-Geblubber. Kostenlos, in 2 Minuten.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#5d5a52",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <span>immoampel.at</span>
          <span>KIM-V-konform · Ohne Registrierung</span>
        </div>
      </div>
    ),
    size
  );
}
