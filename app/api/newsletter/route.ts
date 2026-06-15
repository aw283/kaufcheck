import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(120),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit("newsletter", ip);
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
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Ungültige E-Mail." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const to = process.env.LEAD_NOTIFICATION_EMAIL || "leads@immoampel.at";

  if (!apiKey) {
    console.info("[newsletter] (dev-stub)", { ip });
    return NextResponse.json({ ok: true, mode: "dev-stub" });
  }

  const resend = new Resend(apiKey);
  try {
    if (audienceId) {
      const res = await resend.contacts.create({
        email: parsed.data.email,
        audienceId,
        unsubscribed: false,
      });
      if (res.error) throw new Error(res.error.name);
    } else {
      const res = await resend.emails.send({
        from:
          process.env.LEAD_NOTIFICATION_FROM ||
          "immoampel <onboarding@resend.dev>",
        to: [to],
        subject: "Newsletter-Anmeldung",
        text: `Neue Newsletter-Anmeldung: ${parsed.data.email}\nZeitpunkt: ${new Date().toISOString()}`,
      });
      if (res.error) throw new Error(res.error.name);
    }
  } catch (err) {
    console.error("[newsletter] Fehler", {
      ip,
      type: err instanceof Error ? err.name : "Unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Anmeldung fehlgeschlagen. Bitte erneut versuchen." },
      { status: 502 }
    );
  }

  console.info("[newsletter] success", { ip, via: audienceId ? "audience" : "mail" });
  return NextResponse.json({ ok: true });
}
