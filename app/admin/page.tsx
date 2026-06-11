import Link from "next/link";

import { LogoutButton } from "@/app/admin/logout-button";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUS_VALUES = [
  "neu",
  "kontaktiert",
  "qualifiziert",
  "verkauft",
  "verloren",
] as const;
type Status = (typeof STATUS_VALUES)[number];
type Typ = "finanzierung" | "immobilie";

interface LeadRow {
  id: string;
  created_at: string;
  typ: Typ;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  status: Status;
}

interface CalcRow {
  lead_id: string;
  result: { maxKaufpreis?: number };
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "gerade";
  if (min < 60) return `${min} Min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} Std`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} Tg`;
  return new Date(iso).toLocaleDateString("de-AT");
}

function statusBadge(s: Status) {
  const map: Record<Status, string> = {
    neu: "bg-primary/10 text-primary",
    kontaktiert: "bg-warning/10 text-warning",
    qualifiziert: "bg-warning/10 text-warning",
    verkauft: "bg-success/10 text-success",
    verloren: "bg-muted text-muted-foreground",
  };
  return map[s];
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    typ?: string;
    q?: string;
  }>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page) || 0);
  const statusFilter = STATUS_VALUES.includes(sp.status as Status)
    ? (sp.status as Status)
    : null;
  const typFilter: Typ | null =
    sp.typ === "finanzierung" || sp.typ === "immobilie"
      ? (sp.typ as Typ)
      : null;
  const q = (sp.q ?? "").trim();

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin</h1>
          <LogoutButton />
        </header>
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-5">
          <p className="font-semibold">Supabase nicht konfiguriert</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Setze <code>SUPABASE_URL</code> und{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in den Vercel-Envs und führe
            die SQL-Migration aus <code>db/migrations/001_init.sql</code> aus.
            Anschließend redeploy.
          </p>
        </div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("leads")
    .select("id,created_at,typ,vorname,nachname,email,telefon,status", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (typFilter) query = query.eq("typ", typFilter);
  if (q) {
    // Suche über die häufigsten Felder
    const term = q.replace(/[%_]/g, "");
    query = query.or(
      `vorname.ilike.%${term}%,nachname.ilike.%${term}%,email.ilike.%${term}%`
    );
  }

  const { data: leads, count, error } = await query;
  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          DB-Fehler: {error.message}
        </div>
      </main>
    );
  }

  const rows = (leads ?? []) as LeadRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Max-Kaufpreis pro Lead (aus calculations) nachladen
  const leadIds = rows.map((r) => r.id);
  let calcMap = new Map<string, number>();
  if (leadIds.length > 0) {
    const { data: calcs } = await supabase
      .from("calculations")
      .select("lead_id,result")
      .in("lead_id", leadIds);
    calcMap = new Map(
      ((calcs ?? []) as CalcRow[]).map((c) => [
        c.lead_id,
        Math.round(Number(c.result?.maxKaufpreis ?? 0)),
      ])
    );
  }

  function buildHref(params: Record<string, string | null>) {
    const sp = new URLSearchParams();
    if (statusFilter) sp.set("status", statusFilter);
    if (typFilter) sp.set("typ", typFilter);
    if (q) sp.set("q", q);
    if (page > 0) sp.set("page", String(page));
    for (const [k, v] of Object.entries(params)) {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    }
    const s = sp.toString();
    return s ? `/admin?${s}` : "/admin";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Noch keine Leads."
              : `${total} ${total === 1 ? "Eintrag" : "Einträge"}`}
          </p>
        </div>
        <LogoutButton />
      </header>

      <form className="mb-4 flex flex-wrap items-end gap-2" action="/admin">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Suche (Name oder E-Mail)
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="…"
          />
        </div>
        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Alle</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="typ"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Typ
          </label>
          <select
            id="typ"
            name="typ"
            defaultValue={typFilter ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Alle</option>
            <option value="finanzierung">finanzierung</option>
            <option value="immobilie">immobilie</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Filtern
        </button>
        {(statusFilter || typFilter || q) && (
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:underline"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Datum</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Typ</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Max. Kaufpreis</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Keine Leads gefunden.
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">
                    {relTime(l.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {l.vorname} {l.nachname}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.email}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {l.typ}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(
                        l.status
                      )}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {calcMap.has(l.id)
                      ? `${calcMap.get(l.id)!.toLocaleString("de-AT")} €`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm">
          {page > 0 ? (
            <Link href={buildHref({ page: String(page - 1) })}>← Zurück</Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Seite {page + 1} von {totalPages}
          </span>
          {page < totalPages - 1 ? (
            <Link href={buildHref({ page: String(page + 1) })}>Weiter →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
