/**
 * Dual-Window Rate-Limiter (in-memory).
 *
 * - Kurzzeit-Fenster: blockt Burst-Angriffe (10 Requests / 5 Min).
 * - Langzeit-Fenster: deckelt absoluten Tagesverbrauch (100 / 24 h).
 *
 * MVP-Limit: pro Serverless-Instanz isoliert. Für echte Multi-Replica-
 * Deployments bei Vercel auf Upstash Ratelimit oder Vercel KV
 * umstellen – die Schnittstelle bleibt gleich.
 */

export type RateLimitKey = "extract" | "lead" | "admin_login";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitVerdict {
  ok: boolean;
  /** Sekunden bis das engste verletzte Fenster zurückgesetzt wird. */
  retryAfter: number;
  /** Welches Fenster getrieben hat – fürs Logging. */
  reason?: "short_window" | "long_window";
}

const DEFAULT_LIMITS: Record<
  RateLimitKey,
  { short: RateLimitConfig; long: RateLimitConfig }
> = {
  extract: {
    short: { windowMs: 5 * 60 * 1000, max: 10 },
    long: { windowMs: 24 * 60 * 60 * 1000, max: 100 },
  },
  lead: {
    // Lead-Submission ist seltener Use-Case → großzügig auf der kurzen Seite,
    // hart auf der Tagesseite.
    short: { windowMs: 60 * 1000, max: 5 },
    long: { windowMs: 24 * 60 * 60 * 1000, max: 30 },
  },
  admin_login: {
    // Brute-Force-Schutz: 5 Versuche/Min, 30 Versuche/Tag pro IP.
    short: { windowMs: 60 * 1000, max: 5 },
    long: { windowMs: 24 * 60 * 60 * 1000, max: 30 },
  },
};

interface BucketEntry {
  count: number;
  resetAt: number;
}

/** Map<bucketName, Map<ip, entry>> – pro Limit-Typ separat. */
const stores = new Map<string, Map<string, BucketEntry>>();

function getStore(name: string): Map<string, BucketEntry> {
  let s = stores.get(name);
  if (!s) {
    s = new Map();
    stores.set(name, s);
  }
  return s;
}

function tick(
  store: Map<string, BucketEntry>,
  ip: string,
  cfg: RateLimitConfig
): { exceeded: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + cfg.windowMs });
    return { exceeded: false, retryAfter: 0 };
  }
  if (entry.count >= cfg.max) {
    return {
      exceeded: true,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return { exceeded: false, retryAfter: 0 };
}

export function rateLimit(
  key: RateLimitKey,
  ip: string,
  override?: { short?: RateLimitConfig; long?: RateLimitConfig }
): RateLimitVerdict {
  const cfg = {
    short: override?.short ?? DEFAULT_LIMITS[key].short,
    long: override?.long ?? DEFAULT_LIMITS[key].long,
  };

  // WICHTIG: BEIDE Fenster prüfen, BEIDE inkrementieren – sonst
  // verbraucht ein Request nur ein Fenster und das andere bleibt
  // beliebig hoch.
  const long = tick(getStore(`${key}:long`), ip, cfg.long);
  if (long.exceeded) {
    return { ok: false, retryAfter: long.retryAfter, reason: "long_window" };
  }
  const short = tick(getStore(`${key}:short`), ip, cfg.short);
  if (short.exceeded) {
    return {
      ok: false,
      retryAfter: short.retryAfter,
      reason: "short_window",
    };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Liest die Client-IP aus den Request-Headern. Vercel setzt
 * `x-forwarded-for`; im lokalen Dev-Setup nehmen wir "unknown".
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Gibt eine deutsche Fehlermeldung passend zum getroffenen Fenster. */
export function rateLimitMessage(verdict: RateLimitVerdict): string {
  if (verdict.reason === "long_window") {
    return "Tageslimit für Uploads erreicht. Bitte morgen erneut versuchen oder Werte manuell eingeben.";
  }
  return `Zu viele Anfragen – bitte in ${verdict.retryAfter} Sekunden erneut versuchen.`;
}
