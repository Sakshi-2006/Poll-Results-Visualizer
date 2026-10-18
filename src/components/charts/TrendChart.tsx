import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics";

type TrendChartCardProps = {
  data: TrendPoint[];
  mode: "count" | "cumulative";
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TrendChartCard({ data, mode }: TrendChartCardProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
    cumulative: d.cumulative,
    avgSatisfaction: Number(d.avgSatisfaction.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            fontSize: 13,
          }}
        />
        <Legend
          iconType="plainline"
          wrapperStyle={{ fontSize: 12, color: "#475569" }}
        />
        {mode === "count" ? (
          <Line
            type="monotone"
            dataKey="count"
            name="Daily responses"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#2563eb" }}
            activeDot={{ r: 5 }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="cumulative"
            name="Cumulative responses"
            stroke="#059669"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
