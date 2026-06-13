"use client";

import dynamic from "next/dynamic";

export type SeasonRow = {
  season: string;
  type: "high" | "mid" | "low" | "school_holidays";
  nights: number;
  occupancy: number;
  netRevenue: number;
  avgNightPrice: number;
};

export type MonthRow = {
  month: string;
  monthIndex: number;
  season: string | null;
  seasonType: string | null;
  nights: number;
  occupancy: number;
  netRevenue: number;
  avgNightPrice: number;
};

export type ThresholdPoint = {
  month: string;
  actual: number;
  threshold: number;
};

const SEASON_LABELS: Record<string, string> = {
  high: "Haute saison",
  school_holidays: "Vacances scolaires",
  mid: "Moyenne saison",
  low: "Basse saison",
};

const SEASON_COLORS: Record<string, string> = {
  high: "bg-amber-100 text-amber-800",
  school_holidays: "bg-blue-100 text-blue-800",
  mid: "bg-emerald-100 text-emerald-800",
  low: "bg-slate-100 text-slate-600",
};

function formatEur(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K€` : `${v}€`;
}

const OccupancyThresholdChart = dynamic(
  () =>
    import("recharts").then((m) => ({
      default: ({ data }: { data: ThresholdPoint[] }) => {
        const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = m;
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="#0A0A0A"
                strokeOpacity={0.3}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#0A0A0A"
                strokeOpacity={0.3}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(v: unknown, name: string) => [
                  `${v}%`,
                  name === "actual" ? "Occupation réelle" : "Seuil min",
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid rgba(10,10,10,0.08)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ fill: "#D4AF37", r: 3, strokeWidth: 0 }}
                name="actual"
              />
              <Line
                type="monotone"
                dataKey="threshold"
                stroke="#F97316"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                name="threshold"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      },
    })),
  { ssr: false }
);

export function SeasonalStatsSection({
  seasonal,
  monthly,
  thresholdLine,
}: {
  seasonal: SeasonRow[];
  monthly: MonthRow[];
  thresholdLine: ThresholdPoint[];
}) {
  return (
    <div className="space-y-8">
      {/* Tableau saisonnier */}
      <div className="overflow-hidden rounded-xl border border-navy/10">
        <div className="border-b border-navy/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Performance par saison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/5 bg-offwhite">
                {[
                  "Saison",
                  "Nuitées",
                  "Occupation",
                  "Revenu net",
                  "Prix moy./nuit",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-navy/50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {seasonal.map((row) => (
                <tr
                  key={row.season}
                  className="bg-white transition-colors hover:bg-offwhite"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        SEASON_COLORS[row.type] ?? ""
                      }`}
                    >
                      {SEASON_LABELS[row.type] ?? row.season}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy">{row.nights}</td>
                  <td className="px-4 py-3 font-medium text-navy">
                    {row.occupancy}%
                  </td>
                  <td className="px-4 py-3 font-semibold text-gold">
                    {formatEur(row.netRevenue)}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {formatEur(row.avgNightPrice)}
                  </td>
                </tr>
              ))}
              {seasonal.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-navy/40"
                  >
                    Pas encore de données saisonnières.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courbe occupation vs seuil */}
      {thresholdLine.length > 0 && (
        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">
              Taux d&apos;occupation vs seuil minimum
            </h2>
            <div className="flex gap-4 text-xs text-navy/50">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-gold" />
                Réel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-orange-400" />
                Seuil min
              </span>
            </div>
          </div>
          <OccupancyThresholdChart data={thresholdLine} />
        </div>
      )}

      {/* Tableau mensuel */}
      <div className="overflow-hidden rounded-xl border border-navy/10">
        <div className="border-b border-navy/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">Détail mensuel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/5 bg-offwhite">
                {[
                  "Mois",
                  "Saison",
                  "Nuitées",
                  "Occupation",
                  "Revenu net",
                  "Prix moy./nuit",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-navy/50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {monthly.map((row) => (
                <tr
                  key={row.month}
                  className="bg-white transition-colors hover:bg-offwhite"
                >
                  <td className="px-4 py-3 font-medium capitalize text-navy">
                    {row.month}
                  </td>
                  <td className="px-4 py-3">
                    {row.seasonType && (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          SEASON_COLORS[row.seasonType] ?? ""
                        }`}
                      >
                        {SEASON_LABELS[row.seasonType] ?? row.season}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy">{row.nights}</td>
                  <td className="px-4 py-3 font-medium text-navy">
                    {row.occupancy}%
                  </td>
                  <td className="px-4 py-3 font-semibold text-gold">
                    {formatEur(row.netRevenue)}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {formatEur(row.avgNightPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
