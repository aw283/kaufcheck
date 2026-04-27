import type { Bundesland, Immobilienart } from "@/app/kaufcheck/types";

const IMMOSCOUT_BASE = "https://www.immobilienscout24.at";

const BUNDESLAND_SLUG: Record<Bundesland, string> = {
  wien: "wien",
  noe: "niederoesterreich",
  bgld: "burgenland",
  stmk: "steiermark",
  ktn: "kaernten",
  sbg: "salzburg",
  ooe: "oberoesterreich",
  tirol: "tirol",
  vbg: "vorarlberg",
};

export const BUNDESLAND_LABEL: Record<Bundesland, string> = {
  wien: "Wien",
  noe: "Niederösterreich",
  bgld: "Burgenland",
  stmk: "Steiermark",
  ktn: "Kärnten",
  sbg: "Salzburg",
  ooe: "Oberösterreich",
  tirol: "Tirol",
  vbg: "Vorarlberg",
};

function imartSlug(art: Immobilienart | ""): string {
  if (art === "haus") return "haus-kaufen";
  if (art === "wohnung") return "wohnung-kaufen";
  return "immobilien";
}

function imartRentSlug(art: Immobilienart | ""): string {
  if (art === "haus") return "haus-mieten";
  return "wohnung-mieten";
}

/**
 * Baut einen ImmoScout-Suchlink für den Kauf einer Immobilie mit Obergrenze.
 */
export function buildKaufSearchUrl(opts: {
  bundesland: Bundesland | "";
  immobilienart: Immobilienart | "";
  maxPreis: number;
}): string {
  const land = opts.bundesland
    ? BUNDESLAND_SLUG[opts.bundesland]
    : "oesterreich";
  const art = imartSlug(opts.immobilienart);
  const params = new URLSearchParams();
  if (opts.maxPreis > 0) {
    params.set("price_to", String(Math.round(opts.maxPreis)));
  }
  const qs = params.toString();
  return `${IMMOSCOUT_BASE}/regional/${land}/${art}${qs ? `?${qs}` : ""}`;
}

/**
 * Baut einen ImmoScout-Suchlink für Mietwohnungen mit Monatsmiet-Obergrenze.
 */
export function buildMietSearchUrl(opts: {
  bundesland: Bundesland | "";
  immobilienart: Immobilienart | "";
  maxMiete: number;
}): string {
  const land = opts.bundesland
    ? BUNDESLAND_SLUG[opts.bundesland]
    : "oesterreich";
  const art = imartRentSlug(opts.immobilienart);
  const params = new URLSearchParams();
  if (opts.maxMiete > 0) {
    params.set("price_to", String(Math.round(opts.maxMiete)));
  }
  const qs = params.toString();
  return `${IMMOSCOUT_BASE}/regional/${land}/${art}${qs ? `?${qs}` : ""}`;
}

/**
 * Faustregel-Mietrichtwert:
 * - Haushaltsbudget: max. 30 % des Nettoeinkommens
 * - Gedeckelt bei einer moderaten Obergrenze je Bundesland (damit der
 *   ImmoScout-Link nicht auf unrealistische Miet­bereiche springt).
 * - Fallback ~0,3 % des hypothetischen Kaufpreises, falls das Netto fehlt.
 */
const BUNDESLAND_MIET_CAP: Record<Bundesland, number> = {
  wien: 1600,
  noe: 1300,
  bgld: 1100,
  stmk: 1200,
  ktn: 1100,
  sbg: 1600,
  ooe: 1300,
  tirol: 1500,
  vbg: 1500,
};

export function mietRichtwert(opts: {
  bundesland: Bundesland | "";
  nettoEinkommen: number;
  hypothetischerKaufpreis?: number;
}): number {
  const cap = opts.bundesland ? BUNDESLAND_MIET_CAP[opts.bundesland] : 1300;
  const ausEinkommen = Math.round((opts.nettoEinkommen || 0) * 0.3);
  const ausKaufpreis = Math.round((opts.hypothetischerKaufpreis || 0) * 0.003);

  const basis = ausEinkommen > 0 ? ausEinkommen : ausKaufpreis;
  if (basis <= 0) return cap;
  return Math.min(cap, basis);
}
