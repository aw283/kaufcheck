/**
 * Liest UTM- und verwandte Marketing-Parameter aus der aktuellen URL.
 * Cookie-frei – Werte leben nur im aktuellen Tab (sessionStorage).
 */
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
}

const KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

const SESSION_KEY = "kaufcheck:utm";

function fromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: UtmParams = {};
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) out[k] = v.slice(0, 128); // hard cap
  }
  return out;
}

/**
 * Holt die UTM-Parameter aus der aktuellen URL und merkt sie für den Rest
 * der Browser-Session (sessionStorage, nicht persistent).
 */
export function captureUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  const fresh = fromUrl();
  if (Object.keys(fresh).length > 0) {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
    } catch {
      /* sessionStorage kann blockiert sein */
    }
    return fresh;
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as UtmParams;
  } catch {
    /* ignore */
  }
  return {};
}

export function readUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as UtmParams;
  } catch {
    /* ignore */
  }
  return fromUrl();
}
