import { NextResponse } from "next/server";
import { z } from "zod";

import {
  COOKIE_MAX_AGE_SECONDS,
  COOKIE_NAME,
  signSession,
  timingSafeEqualString,
} from "@/lib/admin-auth";
import { getClientIp, rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const rl = rateLimit("admin_login", ip);
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
      { ok: false, error: "Login fehlgeschlagen" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Login fehlgeschlagen" },
      { status: 400 }
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    // Konfigurationsfehler – nicht an Client preisgeben.
    console.error("[admin/login] ADMIN_PASSWORD nicht gesetzt oder zu kurz.");
    return NextResponse.json(
      { ok: false, error: "Login derzeit nicht verfügbar" },
      { status: 500 }
    );
  }

  const ok = timingSafeEqualString(parsed.data.password, adminPassword);
  if (!ok) {
    console.info("[admin/login] failed attempt", { ip });
    return NextResponse.json(
      { ok: false, error: "Login fehlgeschlagen" },
      { status: 401 }
    );
  }

  let token: string;
  try {
    const sig = await signSession();
    token = sig.token;
  } catch (err) {
    console.error("[admin/login] sign error", err);
    return NextResponse.json(
      { ok: false, error: "Login derzeit nicht verfügbar" },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  console.info("[admin/login] success", { ip });
  return res;
}
