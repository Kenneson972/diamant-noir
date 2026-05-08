"use client";

import dynamic from "next/dynamic";

interface RevenueDataPoint {
  month: string;
  revenue: number;
  isCurrent: boolean;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  hasEnoughHistory: boolean;
}

const RechartsInner = dynamic(
  () =>
    import("recharts").then((m) => ({
      default: ({
        data,
      }: {
        data: RevenueDataPoint[];
      }) => {
        const {
          BarChart,
          Bar,
          XAxis,
          YAxis,
          Tooltip,
          ResponsiveContainer,
          LabelList,
          Cell,
        } = m;

        const tickFormatter = (monthStr: string) => {
          const point = data.find((d) => d.month === monthStr);
          if (!point) return monthStr;
          if (point.isCurrent && point.revenue === 0) return `${monthStr} · en cours`;
          if (point.isCurrent && point.revenue > 0)
            return `${monthStr} · ${point.revenue.toLocaleString("fr-FR")} €`;
          return monthStr;
        };

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="#8B8B8B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E5E3DB", strokeOpacity: 1 }}
                tickFormatter={tickFormatter}
              />
              <YAxis
                stroke="#8B8B8B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}€`}
              />
              <Tooltip
                cursor={{ fill: "#0B1D2E", fillOpacity: 0.03 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E3DB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  fontSize: 13,
                }}
                formatter={(value: unknown) => {
                  const v = typeof value === "number" ? value : 0;
                  return [`${v.toLocaleString("fr-FR")}€`, "Revenu"];
                }}
              />
              <Bar
                dataKey="revenue"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? "#0B1D2E66" : "#0B1D2E"}
                  />
                ))}
                <LabelList
                  dataKey="revenue"
                  content={(props: any) => {
                    const { x, y, width, value, index } = props;
                    const point = data[index as number];
                    if (!point || point.isCurrent || (value as number) !== 0) return null;
                    return (
                      <text
                        x={(x as number) + (width as number) / 2}
                        y={(y as number) + 16}
                        textAnchor="middle"
                        fill="#8B8B8B"
                        fontSize={10}
                      >
                        Aucun revenu
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    })),
  { ssr: false }
);

export function RevenueChart({ data, hasEnoughHistory }: RevenueChartProps) {
  if (!hasEnoughHistory) {
    return (
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">REVENUS MENSUELS</span>
        <div className="mt-4 flex h-80 items-center justify-center rounded-lg bg-[#FAF9F6]">
          <p className="text-sm text-muted text-center px-6">
            Historique disponible après 3 mois d&apos;activité
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <span className="dashboard-eyebrow">REVENUS MENSUELS</span>
      <div className="mt-4 h-80 w-full">
        <RechartsInner data={data} />
      </div>
    </div>
  );
}
