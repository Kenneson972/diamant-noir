"use client";

import dynamic from "next/dynamic";
import type { SeasonConfig } from "@/data/seasons";

interface OccupancyDataPoint {
  month: string;
  monthIndex: number;
  rate: number;
  isCurrent: boolean;
}

interface OccupancyChartProps {
  data: OccupancyDataPoint[];
  hasEnoughHistory: boolean;
  seasons: SeasonConfig[];
}

const OccupancyChartInner = dynamic(
  () =>
    import("recharts").then((m) => ({
      default: ({
        data,
        seasons,
      }: {
        data: OccupancyDataPoint[];
        seasons: SeasonConfig[];
      }) => {
        const {
          LineChart,
          Line,
          XAxis,
          YAxis,
          Tooltip,
          ResponsiveContainer,
          ReferenceArea,
        } = m;

        // Dynamic Y-axis minimum
        const nonCurrentRates = data
          .filter((d) => !d.isCurrent || d.rate > 0)
          .map((d) => d.rate);
        const minVal = nonCurrentRates.length > 0 ? Math.min(...nonCurrentRates) : 0;
        const domainMin = Math.max(0, Math.floor(minVal / 10) * 10 - 10);

        const getSeasonForMonth = (monthIndex: number): SeasonConfig | undefined =>
          seasons.find((s) => s.months.includes(monthIndex));

        // Build reference areas for background shading (consecutive same-season months)
        const shadeAreas: { x1: string; x2: string; color: string }[] = [];
        let i = 0;
        while (i < data.length) {
          const season = getSeasonForMonth(data[i].monthIndex);
          if (season) {
            let j = i;
            while (
              j < data.length &&
              getSeasonForMonth(data[j].monthIndex)?.name === season.name
            ) {
              j++;
            }
            shadeAreas.push({
              x1: data[i].month,
              x2: data[j - 1].month,
              color: season.color,
            });
            i = j;
          } else {
            i++;
          }
        }

        const tickFormatter = (monthStr: string) => {
          const point = data.find((d) => d.month === monthStr);
          if (!point) return monthStr;
          if (point.isCurrent && point.rate === 0) return `${monthStr} · en cours`;
          return monthStr;
        };

        // For the line: hide current month if rate === 0 (no confirmed bookings yet)
        const lineData = data.map((d) =>
          d.isCurrent && d.rate === 0
            ? { ...d, rate: undefined as unknown as number }
            : d
        );

        return (
          <div>
            {/* Season legend — top right */}
            <div className="mb-3 flex justify-end gap-4 flex-wrap">
              {seasons.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1 w-6 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[10px] text-navy/50">{s.name}</span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                {/* Season background shading at ~7% opacity */}
                {shadeAreas.map((area, idx) => (
                  <ReferenceArea
                    key={idx}
                    x1={area.x1}
                    x2={area.x2}
                    fill={area.color}
                    fillOpacity={0.07}
                    stroke="none"
                  />
                ))}

                <XAxis
                  dataKey="month"
                  stroke="#0A0A0A"
                  strokeOpacity={0.4}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={tickFormatter}
                />
                <YAxis
                  domain={[domainMin, 100]}
                  stroke="#0A0A0A"
                  strokeOpacity={0.4}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: unknown) =>
                    v != null ? [`${v}%`, "Taux d'occupation"] : ["—", ""]
                  }
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgba(10, 10, 10, 0.05)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={{ fill: "#D4AF37", strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: "#D4AF37", strokeWidth: 0, r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Season color band below chart */}
            <div className="mt-1 flex overflow-hidden">
              {data.map((d) => {
                const season = getSeasonForMonth(d.monthIndex);
                return (
                  <div
                    key={d.month}
                    className="h-1 flex-1 rounded-sm"
                    style={{
                      backgroundColor: season?.color ?? "transparent",
                      margin: "0 1px",
                    }}
                    title={season?.name}
                  />
                );
              })}
            </div>
          </div>
        );
      },
    })),
  { ssr: false }
);

export function OccupancyChart({ data, hasEnoughHistory, seasons }: OccupancyChartProps) {
  if (!hasEnoughHistory) {
    return (
      <div className="rounded-lg border border-navy/5 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-navy">Taux d&apos;occupation</h3>
        <div className="flex h-64 items-center justify-center rounded-lg bg-[#FAF9F6]">
          <p className="text-sm text-muted text-center px-6">
            Statistiques disponibles après 3 mois d&apos;activité
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-navy/5 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-navy">Taux d&apos;occupation</h3>
      <p className="mb-4 text-[10px] text-navy/40">
        Janvier → Décembre {new Date().getFullYear()}
      </p>

      <OccupancyChartInner data={data} seasons={seasons} />

      {/* Static contextual note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-navy/[0.03] px-4 py-3">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-navy/20 text-[9px] font-bold text-navy/50">
          i
        </span>
        <p className="text-[11px] leading-relaxed text-navy/50">
          Les creux de juin à août correspondent à la basse saison en Martinique —
          comportement normal du marché.
        </p>
      </div>
    </div>
  );
}
