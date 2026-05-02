"use client";

import dynamic from "next/dynamic";

const LineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false }
);
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);

interface OccupancyChartProps {
  data: { month: string; rate: number }[];
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  return (
    <div className="rounded-lg border border-navy/5 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-navy">
        Taux d'occupation
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="month"
              stroke="#0A0A0A"
              strokeOpacity={0.4}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#0A0A0A"
              strokeOpacity={0.4}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(v: unknown) =>
                v != null ? [`${v}%`, "Taux d'occupation"] : ["0%", ""]
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
              stroke="#C9A84C"
              strokeWidth={2}
              dot={{ fill: "#C9A84C", strokeWidth: 0, r: 4 }}
              activeDot={{ fill: "#C9A84C", strokeWidth: 0, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
