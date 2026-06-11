// Edge-kompatible Auth-Lib für das Admin-Backend.
// Verwendet Web Crypto API, damit dieselben Funktionen sowohl in
// proxy.ts (Edge-Runtime) als auch in API-Routes (Node-Runtime) laufen.

export const COOKIE_NAME = "admin_session";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 h

const HEX = "0123456789abcdef";

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
  }
  return out;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET fehlt oder ist zu kurz (min. 32 Zeichen)."
    );
  }
  return secret;
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return bytesToHex(new Uint8Array(sig));
}

/**
 * Session-Token erzeugen. Format: `${expiresAt}.${hex(hmac(expiresAt))}`
 * expiresAt = Unix-ms-Timestamp.
 */
export async function signSession(): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const sig = await hmacSha256(getSecret(), String(expiresAt));
  return { token: `${expiresAt}.${sig}`, expiresAt };
}

/**
 * Session-Token validieren. Edge-tauglich.
 * Akzeptiert nur Tokens deren Signatur passt UND deren Ablauf in der Zukunft liegt.
 */
export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // exp muss valide Zahl + in der Zukunft sein
  if (!/^\d+$/.test(expStr)) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;

  let expected: string;
  try {
    expected = await hmacSha256(getSecret(), expStr);
  } catch {
    return false;
  }

  // Constant-time compare (auch wenn der Code etwas paranoid wirkt –
  // schützt vor Timing-Attacks gegen die Signatur-Erratung)
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Passwort-Vergleich – timing-safe via XOR-Akkumulation.
 * Web-Crypto-frei, läuft in Edge wie in Node.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  // Längen-Ungleichheit ist kein Timing-Leak, weil ein Angreifer
  // die Ziel-Länge ohnehin schon "wüsste" (env var ist fix).
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Liest den Admin-Cookie-Wert aus einem Cookie-Header-String. */
export function readSessionFromHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    if (p.slice(0, eq) === COOKIE_NAME) {
      return decodeURIComponent(p.slice(eq + 1));
    }
  }
  return undefined;
}
