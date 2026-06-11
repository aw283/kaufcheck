// Next.js 16 Proxy (vormals "middleware") — Edge-Runtime.
// Schützt alle /admin/*-Routen außer /admin/login.

import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_NAME,
  readSessionFromHeader,
  verifySession,
} from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;

  // Login-Seite ist whitelisted
  if (url.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Cookie validieren
  const token =
    request.cookies.get(COOKIE_NAME)?.value ??
    readSessionFromHeader(request.headers.get("cookie"));

  let ok = false;
  try {
    ok = await verifySession(token);
  } catch {
    ok = false;
  }

  if (!ok) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
