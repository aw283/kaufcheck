"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface FinanzierungsDonutProps {
  eigenkapital: number;
  kredit: number;
  nebenkosten: number;
}

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

const COLORS = {
  eigenkapital: "var(--success)",
  kredit: "var(--primary)",
  nebenkosten: "var(--warning)",
};

export function FinanzierungsDonut({
  eigenkapital,
  kredit,
  nebenkosten,
}: FinanzierungsDonutProps) {
  const total = eigenkapital + kredit + nebenkosten;
  const data = [
    {
      name: "Eigenkapital",
      value: Math.max(0, eigenkapital),
      color: COLORS.eigenkapital,
    },
    { name: "Kredit", value: Math.max(0, kredit), color: COLORS.kredit },
    {
      name: "Nebenkosten",
      value: Math.max(0, nebenkosten),
      color: COLORS.nebenkosten,
    },
  ].filter((d) => d.value > 0);

  if (total <= 0 || data.length === 0) return null;

  const pct = (v: number) =>
    total > 0 ? ` (${Math.round((v / total) * 100)} %)` : "";

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative h-44 w-44 shrink-0 sm:h-52 sm:w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="96%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value) || 0;
                return [`${formatEuro(v)}${pct(v)}`, String(name)];
              }}
              contentStyle={{
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Gesamtkosten
          </span>
          <span className="text-base font-semibold tabular-nums sm:text-lg">
            {formatEuro(total)}
          </span>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-2 text-sm">
        {data.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
                aria-hidden
              />
              <span className="font-medium">{d.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="tabular-nums">{formatEuro(d.value)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round((d.value / total) * 100)} %
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
