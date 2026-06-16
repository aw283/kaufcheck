import { NextResponse } from "next/server";
import { Resend } from "resend";

import { leadApiSchema } from "@/lib/schemas";
import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { berechneMitAudit, type CheckInput, emptyAssets } from "@/lib/calc";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "";

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

  // ----------------------------------------------------------------
  // 1) DB-Persistierung (best-effort, darf NICHT die Mail blockieren)
  // ----------------------------------------------------------------
  let leadId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .insert({
          typ,
          vorname: lead.vorname,
          nachname: lead.nachname,
          email: lead.email,
          telefon: lead.telefon,
          kontaktzeit: lead.kontaktzeit,
          einwilligung: lead.einwilligung,
          newsletter: lead.newsletter,
          ip,
          user_agent: userAgent.slice(0, 500),
        })
        .select("id")
        .single();
      if (leadErr) throw leadErr;
      leadId = leadRow.id;

      // Falls Check-Ergebnis vorliegt: vollständige Berechnung +
      // Audit serverseitig neu erzeugen (Trust nichts, was vom
      // Client kommt — aber wir haben hier nicht alle CheckInput-
      // Felder, deswegen wird der CheckInput aus den vorhandenen
      // Daten + sinnvollen Defaults rekonstruiert. Das audit ist
      // dadurch zwar vorhanden, deckt sich aber nicht zwingend
      // 1:1 mit dem Client-Ergebnis. Für reine Audit-Zwecke
      // reicht das vollkommen aus.
      if (check && leadId) {
        const reconstructedInput: CheckInput = {
          // netto = effektivNetto (enthält bereits den anteiligen Bonus),
          // daher bonus hier bewusst 0, um Doppelzählung zu vermeiden.
          netto: check.effektivNetto ?? 0,
          nettoPeriode: "monat",
          bonus: 0,
          bonusPeriode: "jahr",
          raten: check.raten ?? 0,
          umschuldung: check.umschuldung ?? 0,
          assets: check.assets ?? emptyAssets(),
          bundesland: (check.bundesland ?? "wien") as CheckInput["bundesland"],
          immobilienart: (check.immobilienart ??
            "wohnung") as CheckInput["immobilienart"],
          objektStatus: (check.objektStatus ??
            "suche_noch") as CheckInput["objektStatus"],
          nutzung: (check.nutzung ?? "eigennutzung") as CheckInput["nutzung"],
          alter: check.alter ?? 35,
          erwachsene: 1,
          kinderAlter: check.kinderAlter ?? [],
        };
        const { result, audit } = berechneMitAudit(reconstructedInput);
        const { error: calcErr } = await supabase.from("calculations").insert({
          lead_id: leadId,
          input: reconstructedInput,
          // Speichere zusätzlich den vom Client gemeldeten Status,
          // damit Diskrepanzen sichtbar werden.
          result: { ...result, client_reported: check },
          audit,
        });
        if (calcErr) throw calcErr;
      }
    } catch (err) {
      console.error("[lead] DB-Persistierung fehlgeschlagen", {
        ip,
        type: err instanceof Error ? err.name : "Unknown",
      });
      // Bewusst weitermachen — Mail hat Vorrang
    }
  }

  // ----------------------------------------------------------------
  // 2) Mail-Versand via Resend
  // ----------------------------------------------------------------
  const to =
    process.env.LEAD_NOTIFICATION_EMAIL || "leads@immoampel.at";
  const from =
    process.env.LEAD_NOTIFICATION_FROM ||
    "immoampel <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  const subject = `Neuer Lead [${typ}]: ${lead.vorname} ${lead.nachname}`;
  const text = [
    `Neuer Lead via immoampel.`,
    ``,
    `Typ:           ${typ}`,
    `Zeitpunkt:     ${createdAt}`,
    `IP:            ${ip}`,
    leadId ? `Lead-ID:       ${leadId}` : `Lead-ID:       (nicht in DB gespeichert)`,
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
          `Eigenkapital:  ${check.eigenkapital} EUR (gesamt)`,
          `Umschuldung:   ${check.umschuldung ? `${check.umschuldung} EUR mitfinanziert` : "keine"}`,
          `Objekt:        ${check.objektStatus === "im_auge" ? "hat konkretes Objekt" : "sucht noch"}`,
          `Nutzung:       ${check.nutzung === "anlage" ? "Kapitalanlage" : "Eigennutzung"}`,
          `Bundesland:    ${check.bundesland ?? "—"}`,
          `Immobilienart: ${check.immobilienart ?? "—"}`,
          `Eff. Netto/M.: ${check.effektivNetto ?? "—"} EUR (inkl. anteil. Bonus)`,
          `Bonus/Variabel:${check.bonus ? ` ${check.bonus} EUR / ${check.bonusPeriode === "monat" ? "Monat" : "Jahr"}` : " keiner"}`,
          `Best. Raten:   ${check.raten ? `${check.raten} EUR/Monat (bleiben)` : "keine"}`,
          `Alter:         ${check.alter ?? "—"}`,
          `Kinder:        ${check.kinderAlter && check.kinderAlter.length > 0 ? check.kinderAlter.join(", ") + " J." : "keine"}`,
          ``,
          `--- Vermögensaufstellung ---`,
          check.assets
            ? [
                `Sparguthaben:     ${check.assets.sparguthaben} EUR`,
                `Wertpapiere:      ${check.assets.wertpapiere} EUR`,
                `Edelmetalle:      ${check.assets.edelmetalle} EUR`,
                `Krypto:           ${check.assets.crypto} EUR`,
                `Lebensvers.:      ${check.assets.lebensversicherung} EUR`,
                `Schenkung/Erbe:   ${check.assets.schenkung} EUR`,
                `Bestehende Immo:  ${check.assets.immobilie_wert} EUR (Restschuld: ${check.assets.immobilie_restschuld} EUR)`,
              ].join("\n")
            : "(keine Asset-Details)",
        ].join("\n")
      : "(kein Check-Ergebnis übermittelt)",
    ``,
    leadId
      ? `→ Lead-Detail im Admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/leads/${leadId}`
      : "",
  ].join("\n");

  if (!apiKey) {
    console.info("[lead] (dev-stub – kein RESEND_API_KEY gesetzt)", {
      to,
      ip,
      typ,
      leadId,
      createdAt,
    });
    return NextResponse.json({ ok: true, mode: "dev-stub", leadId });
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

  console.info("[lead] success", {
    ip,
    typ,
    status_code: 200,
    persisted: Boolean(leadId),
    has_check: Boolean(check),
    newsletter: lead.newsletter,
    created_at: createdAt,
  });

  return NextResponse.json({ ok: true, leadId });
}
