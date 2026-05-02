"use client";

import dynamic from "next/dynamic";

const RechartsComponents = dynamic(
  () =>
    import("recharts").then((m) => ({
      default: ({
        data,
      }: {
        data: { month: string; revenue: number }[];
      }) => {
        const {
          BarChart,
          Bar,
          XAxis,
          YAxis,
          Tooltip,
          ResponsiveContainer,
        } = m;

        if (data.length === 0) {
          return (
            <div className="flex h-80 items-center justify-center text-sm text-muted">
              Aucune donnée de revenus pour le moment
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="#8B8B8B"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#E5E3DB", strokeOpacity: 1 }}
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
                fill="#0B1D2E"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    })),
  { ssr: false }
);

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="dashboard-card">
      <span className="dashboard-eyebrow">REVENUS MENSUELS</span>
      <div className="mt-4 h-80 w-full">
        <RechartsComponents data={data} />
      </div>
    </div>
  );
}
