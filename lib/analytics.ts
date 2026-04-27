/**
 * Abstract analytics layer.
 *
 * MVP ist cookie-los: keine persistenten IDs, kein Fingerprinting.
 * Pro Event wird ein Objekt an ein austauschbares Backend weitergereicht
 * (Console im Dev, später Plausible/PostHog/GA4 via Env-Konfig).
 *
 * ENV-Flags, ohne die das Senden deaktiviert bleibt:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN   – Plausible Domain (z. B. "immoscout.at")
 *   NEXT_PUBLIC_POSTHOG_KEY        – PostHog Project-Key
 *   NEXT_PUBLIC_GA4_ID             – GA4 Measurement-ID (gtag)
 */

import type { LeistbarkeitsStatus } from "@/app/kaufcheck/types";

export type TrackedEvent =
  | { name: "kaufcheck_started"; props: { referrer?: string } }
  | {
      name: "kaufcheck_step_completed";
      props: { step_number: number; step_key: string };
    }
  | {
      name: "kaufcheck_calculated";
      props: {
        status: LeistbarkeitsStatus;
        max_kaufpreis_bucket: string;
        laufzeit_jahre: number;
      };
    }
  | {
      name: "kaufcheck_lead_submitted";
      props: { kontaktzeit: string; newsletter: boolean };
    }
  | { name: "kaufcheck_mietobjekte_clicked"; props: { quelle: string } }
  | { name: "kaufcheck_immoscout_clicked"; props: { quelle: string } };

export type EventName = TrackedEvent["name"];

interface Backend {
  id: string;
  send(name: EventName, props: Record<string, unknown>): void;
}

/** Teilt `maxKaufpreis` in grobe Buckets – verhindert Re-Identifizierung. */
export function kaufpreisBucket(n: number): string {
  if (n <= 0) return "0";
  if (n < 100_000) return "<100k";
  if (n < 150_000) return "100-150k";
  if (n < 200_000) return "150-200k";
  if (n < 300_000) return "200-300k";
  if (n < 500_000) return "300-500k";
  if (n < 750_000) return "500-750k";
  if (n < 1_000_000) return "750k-1M";
  return "1M+";
}

const isServer = typeof window === "undefined";

function getBackends(): Backend[] {
  if (isServer) return [];

  const backends: Backend[] = [];

  // Dev-/Debug-Backend: nur ausgeben, nicht senden.
  if (process.env.NODE_ENV !== "production") {
    backends.push({
      id: "console",
      send(name, props) {
        // eslint-disable-next-line no-console
        console.info("[analytics]", name, props);
      },
    });
  }

  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (plausible) {
    backends.push({
      id: "plausible",
      send(name, props) {
        const payload = JSON.stringify({
          name,
          url: window.location.href,
          domain: plausible,
          props,
        });
        const blob = new Blob([payload], { type: "application/json" });
        // Fire-and-forget, überlebt Page-Unload.
        if (
          "sendBeacon" in navigator &&
          navigator.sendBeacon("https://plausible.io/api/event", blob)
        ) {
          return;
        }
        void fetch("https://plausible.io/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => undefined);
      },
    });
  }

  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  if (ga4) {
    backends.push({
      id: "ga4",
      send(name, props) {
        const gtag = (
          window as unknown as {
            gtag?: (cmd: string, event: string, p: object) => void;
          }
        ).gtag;
        gtag?.("event", name, props);
      },
    });
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (posthogKey) {
    backends.push({
      id: "posthog",
      send(name, props) {
        const posthog = (
          window as unknown as {
            posthog?: { capture: (n: string, p: object) => void };
          }
        ).posthog;
        posthog?.capture(name, props);
      },
    });
  }

  return backends;
}

let cachedBackends: Backend[] | null = null;
function backends(): Backend[] {
  if (isServer) return [];
  if (!cachedBackends) cachedBackends = getBackends();
  return cachedBackends;
}

function dispatch<E extends TrackedEvent>(event: E) {
  if (isServer) return;
  try {
    for (const b of backends()) {
      b.send(event.name, event.props as Record<string, unknown>);
    }
  } catch {
    // Analytics-Fehler dürfen niemals die App brechen.
  }
}

/**
 * Type-sichere Event-API. Jeder Aufruf ist an genau einen Event-Namen
 * gebunden und zwingt die passenden Props ein.
 */
export const analytics = {
  kaufcheckStarted: (referrer?: string) =>
    dispatch({
      name: "kaufcheck_started",
      props: { referrer: referrer || undefined },
    }),

  stepCompleted: (stepNumber: number, stepKey: string) =>
    dispatch({
      name: "kaufcheck_step_completed",
      props: { step_number: stepNumber, step_key: stepKey },
    }),

  calculated: (
    status: LeistbarkeitsStatus,
    maxKaufpreis: number,
    laufzeitJahre: number
  ) =>
    dispatch({
      name: "kaufcheck_calculated",
      props: {
        status,
        max_kaufpreis_bucket: kaufpreisBucket(maxKaufpreis),
        laufzeit_jahre: laufzeitJahre,
      },
    }),

  leadSubmitted: (kontaktzeit: string, newsletter: boolean) =>
    dispatch({
      name: "kaufcheck_lead_submitted",
      props: { kontaktzeit, newsletter },
    }),

  mietobjekteClicked: (quelle: string) =>
    dispatch({
      name: "kaufcheck_mietobjekte_clicked",
      props: { quelle },
    }),

  immoscoutClicked: (quelle: string) =>
    dispatch({
      name: "kaufcheck_immoscout_clicked",
      props: { quelle },
    }),
};
