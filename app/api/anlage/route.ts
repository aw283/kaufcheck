import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { anlegerApiSchema, empfiehl, MODELL_INFO } from "@/lib/anleger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const rl = rateLimit("lead", ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: rateLimitMessage(rl) },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Request-Body." },
      { status: 400 }
    );
  }

  const parsed = anlegerApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validierung fehlgeschlagen." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const result = empfiehl(d);
  const info = MODELL_INFO[result.primaer];
  const createdAt = new Date().toISOString();

  const to = process.env.LEAD_NOTIFICATION_EMAIL || "leads@immoampel.at";
  const from =
    process.env.LEAD_NOTIFICATION_FROM || "immoampel <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  const BUNDESLAND_LABELS: Record<string, string> = {
    wien: "Wien",
    noe: "Niederösterreich",
    ooe: "Oberösterreich",
    sbg: "Salzburg",
    tirol: "Tirol",
    vbg: "Vorarlberg",
    stmk: "Steiermark",
    ktn: "Kärnten",
    bgld: "Burgenland",
  };

  const fmt = (n: number) => Math.round(n).toLocaleString("de-AT");
  const subject = `Neuer Anleger-Lead: ${d.name}`;
  const text = [
    `Neuer Anleger-Lead via immoampel ("Immobilie als Steuerhebel").`,
    ``,
    `Zeitpunkt:        ${createdAt}`,
    `IP:               ${ip}`,
    ``,
    `--- Empfohlenes Anlagemodell ---`,
    `Modell:           ${info.titel}`,
    `Begründung:       ${result.begruendung}`,
    `Alternativen:     ${result.alternativen.map((m) => MODELL_INFO[m].titel).join(", ")}`,
    result.hinweis ? `Hinweis:          ${result.hinweis}` : "",
    ``,
    `--- Anlegerprofil ---`,
    `Anlageziel:       ${d.anlageziel}`,
    `Horizont:         ${d.horizont}`,
    `Steuerlast:       ${d.steuerlast}`,
    `Budget (EK):      ${fmt(d.budget)} EUR`,
    `Fremdfinanzierung: ${d.finanzierung ? "Ja" : "Nein"}`,
    `Bundesland:       ${BUNDESLAND_LABELS[d.bundesland] ?? d.bundesland}`,
    ``,
    `--- Kontakt ---`,
    `Name:             ${d.name}`,
    `E-Mail:           ${d.email}`,
    `Telefon:          ${d.telefon}`,
    `Einwilligung:     ${d.einwilligung ? "erteilt" : "—"}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  if (!apiKey) {
    console.info("[anlage] (dev-stub – kein RESEND_API_KEY)", {
      to,
      ip,
      name: d.name,
      modell: result.primaer,
      createdAt,
    });
    return NextResponse.json({ ok: true, mode: "dev-stub", result });
  }

  try {
    const resend = new Resend(apiKey);
    const sent = await resend.emails.send({
      from,
      to: [to],
      replyTo: d.email,
      subject,
      text,
    });
    if (sent.error) {
      console.error("[anlage] Resend-Fehler", { ip, status: sent.error.name });
      return NextResponse.json(
        { ok: false, error: "E-Mail-Versand fehlgeschlagen. Bitte erneut versuchen." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[anlage] Unerwarteter Fehler", {
      ip,
      type: err instanceof Error ? err.name : "Unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Unerwarteter Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }

  console.info("[anlage] success", {
    ip,
    modell: result.primaer,
    status_code: 200,
    created_at: createdAt,
  });

  return NextResponse.json({ ok: true, result });
}
