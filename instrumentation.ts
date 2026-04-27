/**
 * Next.js Instrumentation – einmal pro Server-/Edge-Runtime geladen.
 *
 * **Aktueller Stand**: Sentry ist NICHT installiert. Diese Datei
 * dokumentiert den vorgesehenen Einhängepunkt und liefert die
 * Scrubber-Funktion, die jeder Sink (Sentry, Datadog, Logflare …)
 * in seinem `beforeSend`-Hook verwenden MUSS.
 *
 * **Zum Aktivieren von Sentry:**
 *   1. `npm install @sentry/nextjs`
 *   2. `SENTRY_DSN` in den Vercel-Project-Env-Vars hinterlegen.
 *   3. Den Init-Block in `register()` einkommentieren.
 *   4. `beforeSend: scrubEvent` (siehe unten) zwingend setzen.
 *
 * **DSGVO-Hinweis:** Jeder Error-Sink MUSS einen `beforeSend`-Hook
 * mit dem hier definierten Scrubber haben. Wir loggen ohnehin nur
 * Metadaten (`safeLog` in den API-Routen), aber Stack-Traces,
 * Breadcrumbs und Request-Bodies können sonst sensible Reste enthalten.
 */

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  // Sentry wird erst aktiv, sobald @sentry/nextjs installiert ist.
  // Bis dahin: nichts tun – Audit-Checkliste hat den Punkt
  // "Sentry-beforeSend verifiziert" als Go-Live-Blocker drin.
  //
  // Beispiel-Init nach Installation:
  //
  //   import * as Sentry from "@sentry/nextjs";
  //   Sentry.init({
  //     dsn,
  //     environment: process.env.NODE_ENV,
  //     tracesSampleRate: 0.1,
  //     beforeSend: scrubEvent,
  //     beforeBreadcrumb: () => null,
  //   });
}

/**
 * Scrubber: entfernt potenzielle PII / sensible Strings aus dem Event,
 * bevor es an einen Error-Tracking-Sink gesendet wird.
 *
 * Wird hier exportiert, damit Tests + zukünftige Sentry-Init dieselbe
 * Logik nutzen.
 */
export function scrubEvent(event: unknown): unknown {
  if (!event || typeof event !== "object") return event;
  const e = event as Record<string, unknown>;

  // Request-Body komplett verwerfen – kann hochgeladenes PDF (base64)
  // oder ein Lead-Formular mit Klarnamen enthalten.
  if (e.request && typeof e.request === "object") {
    const req = e.request as Record<string, unknown>;
    delete req.data;
    delete req.cookies;
    if (req.headers && typeof req.headers === "object") {
      const headers = req.headers as Record<string, unknown>;
      delete headers.authorization;
      delete headers.cookie;
      delete headers["x-api-key"];
    }
    if (req.query_string) req.query_string = "[scrubbed]";
  }

  // User-Object: keine E-Mail, kein Username – nur ggf. ein gehashter
  // anonymer Identifier.
  if (e.user && typeof e.user === "object") {
    const user = e.user as Record<string, unknown>;
    delete user.email;
    delete user.username;
    delete user.ip_address;
  }

  scrubMap(e.extra);
  scrubMap(e.tags);

  // Exception/Stack-Strings durchsuchen – wenn ein File-Pfad im Mount
  // steht oder ein base64-Schnipsel auftaucht, lieber Trace verkürzen.
  const exception = (e as { exception?: { values?: unknown[] } }).exception;
  if (exception && Array.isArray(exception.values)) {
    for (const v of exception.values) {
      if (v && typeof v === "object") {
        const ex = v as Record<string, unknown>;
        if (typeof ex.value === "string") {
          ex.value = redactSensitive(ex.value);
        }
      }
    }
  }

  return e;
}

function scrubMap(maybeObj: unknown) {
  if (!maybeObj || typeof maybeObj !== "object") return;
  const m = maybeObj as Record<string, unknown>;
  for (const k of Object.keys(m)) {
    const v = m[k];
    if (typeof v === "string") {
      m[k] = redactSensitive(v);
    }
  }
}

export function redactSensitive(s: string): string {
  // Lange Base64-Strings (PDF-Inhalt, signierte Tokens) verbergen.
  if (s.length > 200 && /^[A-Za-z0-9+/=]{200,}$/.test(s.slice(0, 240))) {
    return "[scrubbed:base64]";
  }
  return s
    // E-Mail
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[scrubbed:email]")
    // IBAN
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, "[scrubbed:iban]")
    // Telefonnummern (grob)
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[scrubbed:phone]");
}
