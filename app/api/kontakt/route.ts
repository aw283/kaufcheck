import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
  betreff: z.string().trim().min(2).max(150),
  nachricht: z.string().trim().min(5).max(5000),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit("kontakt", ip);
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
    return NextResponse.json(
      { ok: false, error: "Bitte alle Felder korrekt ausfüllen." },
      { status: 400 }
    );
  }
  const { name, email, betreff, nachricht } = parsed.data;

  // DB best-effort
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("messages").insert({ name, email, betreff, nachricht, ip });
    } catch (err) {
      console.error("[kontakt] DB-Fehler", {
        ip,
        type: err instanceof Error ? err.name : "Unknown",
      });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL || "leads@immoampel.at";
  if (!apiKey) {
    console.info("[kontakt] (dev-stub)", { ip });
    return NextResponse.json({ ok: true, mode: "dev-stub" });
  }

  try {
    const resend = new Resend(apiKey);
    const res = await resend.emails.send({
      from:
        process.env.LEAD_NOTIFICATION_FROM ||
        "immoampel <onboarding@resend.dev>",
      to: [to],
      replyTo: email,
      subject: `Kontakt: ${betreff}`,
      text: `Neue Kontakt-Nachricht via immoampel.\n\nName: ${name}\nE-Mail: ${email}\nBetreff: ${betreff}\n\n${nachricht}`,
    });
    if (res.error) throw new Error(res.error.name);
  } catch (err) {
    console.error("[kontakt] Mail-Fehler", {
      ip,
      type: err instanceof Error ? err.name : "Unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Senden fehlgeschlagen. Bitte erneut versuchen." },
      { status: 502 }
    );
  }

  console.info("[kontakt] success", { ip });
  return NextResponse.json({ ok: true });
}
