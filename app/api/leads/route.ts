import { NextResponse } from "next/server";

import { leadApiSchema } from "@/app/kaufcheck/lib/lead-schema";
import {
  getClientIp,
  rateLimit,
  rateLimitMessage,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LeadRecord {
  created_at: string;
  source: string;
  lead: unknown;
  kaufcheck: unknown;
  context: unknown;
  ip: string;
}

async function persistLead(record: LeadRecord): Promise<void> {
  // 1) Supabase (REST): wenn beide Env-Vars gesetzt sind.
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey) {
    try {
      const res = await fetch(
        `${supaUrl}/rest/v1/kaufcheck_leads`,
        {
          method: "POST",
          headers: {
            apikey: supaKey,
            Authorization: `Bearer ${supaKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(record),
        }
      );
      if (!res.ok) {
        console.error(
          "[leads] Supabase insert failed",
          res.status,
          await res.text().catch(() => "")
        );
      }
    } catch (err) {
      console.error("[leads] Supabase error", err);
    }
  }

  // 2) Generischer CRM-Webhook als Fallback / zusätzlicher Sink.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    } catch (err) {
      console.error("[leads] Webhook error", err);
    }
  }

  // 3) Dev-Log, wenn kein Sink konfiguriert ist.
  if (!supaUrl && !webhook) {
    console.info("[leads] (dev-log)", JSON.stringify(record));
  }
}

async function notifyEmail(record: LeadRecord): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO || "sales@immobilienscout.at";
  const from =
    process.env.LEAD_EMAIL_FROM || "ImmoScout Kaufcheck <no-reply@immobilienscout.at>";

  if (!apiKey) {
    // Stub: nur loggen, damit lokale Entwicklung ohne Resend-Key funktioniert.
    console.info(`[leads] (email-stub) → ${to}: neuer Lead`);
    return;
  }

  const lead = record.lead as {
    vorname: string;
    nachname: string;
    email: string;
    telefon: string;
    kontaktzeit: string;
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `Neuer Kaufcheck-Lead: ${lead.vorname} ${lead.nachname}`,
        text: [
          `Neuer Lead aus dem ImmoScout-Kaufcheck.`,
          ``,
          `Name:       ${lead.vorname} ${lead.nachname}`,
          `E-Mail:     ${lead.email}`,
          `Telefon:    ${lead.telefon}`,
          `Erreichbar: ${lead.kontaktzeit}`,
          ``,
          `Payload:`,
          JSON.stringify(record, null, 2),
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error(
        "[leads] Resend failed",
        res.status,
        await res.text().catch(() => "")
      );
    }
  } catch (err) {
    console.error("[leads] Resend error", err);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const rl = rateLimit("lead", ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(rl) },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungültiges JSON im Request-Body." },
      { status: 400 }
    );
  }

  const parsed = leadApiSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validierung fehlgeschlagen.",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const record: LeadRecord = {
    created_at: new Date().toISOString(),
    source: "kaufcheck",
    lead: parsed.data.lead,
    kaufcheck: parsed.data.kaufcheck,
    context: parsed.data.context,
    ip,
  };

  // Persistieren + E-Mail parallel, Fehler dort loggen aber Client erfolgreich
  // bestätigen, sobald die Validierung ok ist.
  await Promise.all([persistLead(record), notifyEmail(record)]);

  return NextResponse.json({ ok: true });
}
