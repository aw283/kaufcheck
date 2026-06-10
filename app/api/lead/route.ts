import { NextResponse } from "next/server";
import { Resend } from "resend";

import { leadApiSchema } from "@/lib/schemas";
import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";

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

  const parsed = leadApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validierung fehlgeschlagen." },
      { status: 400 }
    );
  }

  const { lead, typ, check } = parsed.data;
  const createdAt = new Date().toISOString();

  const to =
    process.env.LEAD_NOTIFICATION_EMAIL || "leads@wohnkredit-check.at";
  const from =
    process.env.LEAD_NOTIFICATION_FROM ||
    "Wohnkredit-Check <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  const subject = `Neuer Lead [${typ}]: ${lead.vorname} ${lead.nachname}`;
  const text = [
    `Neuer Lead via Wohnkredit-Check.`,
    ``,
    `Typ:           ${typ}`,
    `Zeitpunkt:     ${createdAt}`,
    `IP:            ${ip}`,
    ``,
    `Name:          ${lead.vorname} ${lead.nachname}`,
    `E-Mail:        ${lead.email}`,
    `Telefon:       ${lead.telefon}`,
    `Kontaktzeit:   ${lead.kontaktzeit}`,
    `Newsletter:    ${lead.newsletter ? "ja" : "nein"}`,
    `Einwilligung:  ${lead.einwilligung ? "erteilt" : "—"}`,
    ``,
    `--- Check-Ergebnis ---`,
    check
      ? [
          `Status:        ${check.status}`,
          `Max Kaufpreis: ${check.maxKaufpreis} EUR`,
          `Monatsrate:    ${check.monatlicheRate} EUR`,
          `EK-Quote:      ${Math.round(check.ekQuote * 100)} %`,
          `Bundesland:    ${check.bundesland ?? "—"}`,
          `Immobilienart: ${check.immobilienart ?? "—"}`,
          `Eigenkapital:  ${check.eigenkapital ?? "—"} EUR`,
          `Netto/Monat:   ${check.netto ?? "—"} EUR`,
        ].join("\n")
      : "(kein Check-Ergebnis übermittelt)",
  ].join("\n");

  if (!apiKey) {
    // Dev/Stub-Fallback: nur loggen, damit lokal ohne Resend getestet werden
    // kann. In Production muss der Key gesetzt sein.
    console.info("[lead] (dev-stub – kein RESEND_API_KEY gesetzt)", {
      to,
      subject,
      ip,
      typ,
      createdAt,
    });
    return NextResponse.json({ ok: true, mode: "dev-stub" });
  }

  try {
    const resend = new Resend(apiKey);
    const sent = await resend.emails.send({
      from,
      to: [to],
      replyTo: lead.email,
      subject,
      text,
    });
    if (sent.error) {
      console.error("[lead] Resend-Fehler", {
        ip,
        status: sent.error.name,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "E-Mail-Versand fehlgeschlagen. Bitte erneut versuchen.",
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[lead] Unerwarteter Fehler", {
      ip,
      type: err instanceof Error ? err.name : "Unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Unerwarteter Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }

  // Audit-Log – nur Metadaten, keine PII
  console.info("[lead] success", {
    ip,
    typ,
    status_code: 200,
    has_check: Boolean(check),
    newsletter: lead.newsletter,
    created_at: createdAt,
  });

  return NextResponse.json({ ok: true });
}
