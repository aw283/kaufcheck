import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import {
  bautraegerApiSchema,
  klassifiziere,
  PARTNERWEG_LABEL,
} from "@/lib/bautraeger";

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

  const parsed = bautraegerApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validierung fehlgeschlagen." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const result = klassifiziere(d);
  const weg = PARTNERWEG_LABEL[result.weg];
  const createdAt = new Date().toISOString();

  const to = process.env.LEAD_NOTIFICATION_EMAIL || "leads@immoampel.at";
  const from =
    process.env.LEAD_NOTIFICATION_FROM || "immoampel <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  const fmt = (n: number) => Math.round(n).toLocaleString("de-AT");
  const subject = `Neuer Bauträger-Lead: ${d.firma}`;
  const text = [
    `Neuer Bauträger-Finanzierungs-Lead via immoampel.`,
    ``,
    `Zeitpunkt:        ${createdAt}`,
    `IP:               ${ip}`,
    ``,
    `--- Empfohlener Partnerweg ---`,
    `Weg:              ${weg.titel}`,
    `Zusatzkapital:    ${fmt(result.zusatzkapital)} EUR (Schwelle ${result.schwelleMio} Mio.)`,
    `EK-Quote:         ${Math.round(result.ekQuote * 100)} % (${result.ekFlag === "ok" ? "ok" : "knapp – evtl. nachschärfen"})`,
    ``,
    `--- Projekt ---`,
    `Projektart:       ${d.projektart}`,
    `Phase:            ${d.phase}`,
    `Standort:         ${d.ort} (${d.bundesland})`,
    `Volumen (GIK):    ${fmt(d.volumen)} EUR`,
    `Eigenkapital:     ${fmt(d.eigenkapital)} EUR`,
    `Bankzusage:       ${fmt(d.bankzusage)} EUR`,
    `Gewünscht:        ${d.kapitalart}`,
    ``,
    `--- Kontakt ---`,
    `Firma:            ${d.firma}`,
    `Ansprechpartner:  ${d.ansprechpartner}`,
    `E-Mail:           ${d.email}`,
    `Telefon:          ${d.telefon}`,
    `Website:          ${d.website || "—"}`,
    `Einwilligung:     ${d.einwilligung ? "erteilt" : "—"}`,
  ].join("\n");

  if (!apiKey) {
    console.info("[bautraeger] (dev-stub – kein RESEND_API_KEY)", {
      to,
      ip,
      firma: d.firma,
      weg: result.weg,
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
      console.error("[bautraeger] Resend-Fehler", { ip, status: sent.error.name });
      return NextResponse.json(
        { ok: false, error: "E-Mail-Versand fehlgeschlagen. Bitte erneut versuchen." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[bautraeger] Unerwarteter Fehler", {
      ip,
      type: err instanceof Error ? err.name : "Unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Unerwarteter Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }

  console.info("[bautraeger] success", {
    ip,
    weg: result.weg,
    status_code: 200,
    created_at: createdAt,
  });

  return NextResponse.json({ ok: true, result });
}
