import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { COOKIE_NAME, verifySession } from "@/lib/admin-auth";
import type { CalcAudit, EkRow } from "@/lib/calc";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  created_at: string;
  typ: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  kontaktzeit: string;
  einwilligung: boolean;
  newsletter: boolean;
  status: string;
  notes: string | null;
  ip: string | null;
  user_agent: string | null;
}

interface CalcRow {
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  audit: CalcAudit;
}

const STATUS_VALUES = [
  "neu",
  "kontaktiert",
  "qualifiziert",
  "verkauft",
  "verloren",
] as const;

async function requireAdminSession() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  const ok = await verifySession(token);
  if (!ok) redirect("/admin/login");
}

// --- Server Actions (inline, vor jeder Action erneut Auth-Check) -------

async function updateStatus(formData: FormData) {
  "use server";
  await requireAdminSession();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) return;
  const supabase = getSupabaseAdmin();
  await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

async function updateNotes(formData: FormData) {
  "use server";
  await requireAdminSession();
  const id = String(formData.get("id"));
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  const supabase = getSupabaseAdmin();
  await supabase.from("leads").update({ notes }).eq("id", id);
  revalidatePath(`/admin/leads/${id}`);
}

// --- Page -----------------------------------------------------------

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="rounded-lg border bg-warning/5 p-4 text-sm">
          Supabase nicht konfiguriert.
        </p>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id,created_at,typ,vorname,nachname,email,telefon,kontaktzeit,einwilligung,newsletter,status,notes,ip,user_agent"
    )
    .eq("id", id)
    .single<LeadRow>();

  if (!lead) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zurück zur Liste
        </Link>
        <p className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm">
          Lead nicht gefunden.
        </p>
      </main>
    );
  }

  const { data: calc } = await supabase
    .from("calculations")
    .select("input,result,audit")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CalcRow>();

  const audit = calc?.audit;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Zurück zur Liste
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        {lead.vorname} {lead.nachname}
      </h1>
      <p className="text-sm text-muted-foreground">
        Lead vom{" "}
        {new Date(lead.created_at).toLocaleString("de-AT", {
          dateStyle: "medium",
          timeStyle: "short",
        })}{" "}
        · Typ: {lead.typ}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        {/* LEFT — Contact & Status */}
        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Kontakt
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="E-Mail">
                <a
                  href={`mailto:${lead.email}`}
                  className="text-primary hover:underline"
                >
                  <Mail className="mr-1 inline h-3 w-3" aria-hidden />
                  {lead.email}
                </a>
              </Row>
              <Row label="Telefon">
                <a
                  href={`tel:${lead.telefon}`}
                  className="text-primary hover:underline"
                >
                  <Phone className="mr-1 inline h-3 w-3" aria-hidden />
                  {lead.telefon}
                </a>
              </Row>
              <Row label="Kontaktzeit">{lead.kontaktzeit}</Row>
              <Row label="Newsletter">{lead.newsletter ? "ja" : "nein"}</Row>
              <Row label="Einwilligung">
                {lead.einwilligung ? "erteilt" : "—"}
              </Row>
              {lead.ip ? <Row label="IP">{lead.ip}</Row> : null}
            </dl>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </h2>
            <form action={updateStatus} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={lead.id} />
              <select
                name="status"
                defaultValue={lead.status}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm">
                Speichern
              </Button>
            </form>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Notizen
            </h2>
            <form action={updateNotes} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={lead.id} />
              <textarea
                name="notes"
                rows={5}
                defaultValue={lead.notes ?? ""}
                placeholder="Z. B. Telefonat-Zusammenfassung, nächste Schritte …"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm" variant="outline">
                Notiz speichern
              </Button>
            </form>
          </section>
        </aside>

        {/* RIGHT — Calculation Audit */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Berechnung — Schritt für Schritt
          </h2>

          {!audit ? (
            <p className="mt-3 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Für diesen Lead wurde kein Berechnungs-Snapshot gespeichert.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <AuditCard
                title="1. Laufzeit"
                ergebnis={`${audit.laufzeitJahre.ergebnis} Jahre`}
                formel={audit.laufzeitJahre.formel}
                rows={[
                  ["Alter", String(audit.laufzeitJahre.alter)],
                  ["Default-Laufzeit", String(audit.laufzeitJahre.default)],
                  ["Endalter (max.)", String(audit.laufzeitJahre.endalterMax)],
                ]}
              />
              <AuditCard
                title="2. Verfügbar für Schuldendienst"
                ergebnis={`${audit.verfuegbar.ergebnis.toLocaleString(
                  "de-AT"
                )} € / Monat`}
                formel={audit.verfuegbar.formel}
                rows={[
                  ["Netto/Monat", `${audit.verfuegbar.netto} €`],
                  ["DSTI max.", `${audit.verfuegbar.dstiMax * 100} %`],
                  ["Bestehende Raten", `${audit.verfuegbar.raten} €`],
                  ["Fixkosten", `${audit.verfuegbar.fix} €`],
                ]}
              />
              <AuditCard
                title="3. PV-Annuitäten-Faktor"
                ergebnis={audit.pvFactor.ergebnis.toFixed(4)}
                formel={audit.pvFactor.formel}
                rows={[
                  ["Zinssatz p.a.", `${audit.pvFactor.zinsPa * 100} %`],
                  [
                    "Zins monatlich (i)",
                    audit.pvFactor.zinsMonatlich.toFixed(5),
                  ],
                  ["Monate (n)", String(audit.pvFactor.monate)],
                ]}
              />
              <AuditCard
                title="4. Maximale Kreditsumme"
                ergebnis={`${audit.maxKredit.ergebnis.toLocaleString("de-AT")} €`}
                formel={audit.maxKredit.formel}
                rows={[
                  [
                    "Verfügbar",
                    `${audit.maxKredit.verfuegbar.toLocaleString("de-AT")} €`,
                  ],
                  ["PV-Faktor", audit.maxKredit.pvFactor.toFixed(4)],
                ]}
              />
              <EkBreakdownCard
                rows={audit.ekBreakdown}
                total={audit.eigenkapital.total}
              />
              <AuditCard
                title="6. Gesamtbudget"
                ergebnis={`${audit.gesamtbudget.ergebnis.toLocaleString(
                  "de-AT"
                )} €`}
                formel={audit.gesamtbudget.formel}
                rows={[
                  [
                    "Eigenkapital",
                    `${audit.gesamtbudget.eigenkapital.toLocaleString("de-AT")} €`,
                  ],
                  [
                    "Max. Kredit",
                    `${audit.gesamtbudget.maxKredit.toLocaleString("de-AT")} €`,
                  ],
                ]}
              />
              <AuditCard
                title="7. Max. Kaufpreis"
                ergebnis={`${audit.maxKaufpreis.ergebnis.toLocaleString(
                  "de-AT"
                )} €`}
                formel={audit.maxKaufpreis.formel}
                rows={[
                  [
                    "Gesamtbudget",
                    `${audit.maxKaufpreis.gesamtbudget.toLocaleString("de-AT")} €`,
                  ],
                  [
                    "Nebenkosten-Quote",
                    `${audit.maxKaufpreis.nebenkostenQuote * 100} %`,
                  ],
                ]}
              />
              <AuditCard
                title="8. Nebenkosten"
                ergebnis={`${audit.nebenkosten.ergebnis.toLocaleString(
                  "de-AT"
                )} €`}
                formel={audit.nebenkosten.formel}
                rows={[
                  [
                    "Max. Kaufpreis",
                    `${audit.nebenkosten.maxKaufpreis.toLocaleString("de-AT")} €`,
                  ],
                  ["Quote", `${audit.nebenkosten.quote * 100} %`],
                ]}
              />
              <AuditCard
                title="9. Eigenkapitalquote"
                ergebnis={`${(audit.ekQuote.ergebnis * 100).toFixed(1)} %`}
                formel={audit.ekQuote.formel}
                rows={[
                  [
                    "Eigenkapital",
                    `${audit.ekQuote.eigenkapital.toLocaleString("de-AT")} €`,
                  ],
                  [
                    "Gesamtbudget",
                    `${audit.ekQuote.gesamtbudget.toLocaleString("de-AT")} €`,
                  ],
                ]}
              />
              <StatusDecisionCard audit={audit} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function AuditCard({
  title,
  formel,
  rows,
  ergebnis,
}: {
  title: string;
  formel: string;
  rows: [string, string][];
  ergebnis: string;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-base font-bold tabular-nums">{ergebnis}</span>
      </header>
      <pre className="mt-2 overflow-x-auto rounded-md bg-muted/60 px-3 py-2 text-xs font-mono">
        {formel}
      </pre>
      <dl className="mt-2 grid gap-1 text-xs">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-2 border-b border-dashed border-border/50 pb-1 last:border-0"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function EkBreakdownCard({
  rows,
  total,
}: {
  rows: EkRow[];
  total: number;
}) {
  const used = rows.filter((r) => r.gezaehlt > 0);
  return (
    <section className="rounded-lg border-2 border-success/30 bg-success/5 p-4 shadow-sm">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">5. Eigenkapital im Detail</h3>
        <span className="text-base font-bold tabular-nums text-success">
          {total.toLocaleString("de-AT")} €
        </span>
      </header>
      {used.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Kein Vermögen angegeben.
        </p>
      ) : (
        <dl className="mt-3 space-y-1 text-xs">
          {used.map((r) => (
            <div
              key={r.key}
              className="flex items-baseline justify-between gap-2 border-b border-dashed border-border/50 pb-1 last:border-0"
            >
              <dt className="text-muted-foreground">
                {r.label}
                {r.faktor < 1 ? ` (× ${Math.round(r.faktor * 100)} %)` : ""}
              </dt>
              <dd className="tabular-nums">
                {r.gezaehlt.toLocaleString("de-AT")} €
                {r.faktor < 1 ? (
                  <span className="ml-1 text-muted-foreground">
                    (roh: {r.raw.toLocaleString("de-AT")})
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function StatusDecisionCard({ audit }: { audit: CalcAudit }) {
  return (
    <section className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 shadow-sm">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">10. Status-Entscheidung</h3>
        <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase text-primary">
          {audit.statusEntscheidung.status}
        </span>
      </header>
      <ol className="mt-3 space-y-1.5 text-xs">
        {audit.statusEntscheidung.geprueft.map((r, idx) => {
          const griff = r === audit.statusEntscheidung.griff;
          return (
            <li
              key={idx}
              className={`rounded-md px-2 py-1.5 ${
                griff
                  ? "bg-primary/15 font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {griff ? "→ " : ""}
              {r}
            </li>
          );
        })}
        {!audit.statusEntscheidung.geprueft.includes(
          audit.statusEntscheidung.griff
        ) ? (
          <li className="rounded-md bg-primary/15 px-2 py-1.5 font-semibold">
            → {audit.statusEntscheidung.griff}
          </li>
        ) : null}
      </ol>
    </section>
  );
}
