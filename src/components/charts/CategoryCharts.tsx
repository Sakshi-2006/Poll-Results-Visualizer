import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { CategoryDatum } from "@/lib/analytics";

export const CHART_COLORS = [
  "#2563eb",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#0d9488",
  "#ca8a04",
  "#4f46e5",
];

type BarChartCardProps = {
  data: CategoryDatum[];
  colors?: string[];
  valueLabel?: string;
  showPercent?: boolean;
};

export function BarChartCard({
  data,
  colors = CHART_COLORS,
  valueLabel = "Responses",
  showPercent = false,
}: BarChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#475569", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            fontSize: 13,
          }}
          formatter={(value: number, _name, item) => {
            const pct = (item?.payload as CategoryDatum)?.percent ?? 0;
            return showPercent
              ? [`${pct.toFixed(1)}%`, valueLabel]
              : [`${value} (${pct.toFixed(1)}%)`, valueLabel];
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

type DonutChartCardProps = {
  data: CategoryDatum[];
  colors?: string[];
};

export function DonutChartCard({
  data,
  colors = CHART_COLORS,
}: DonutChartCardProps) {
  const total = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data]
  );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            fontSize: 13,
          }}
          formatter={(value: number, _name, item) => {
            const pct = (item?.payload as CategoryDatum)?.percent ?? 0;
            return [`${value} (${pct.toFixed(1)}%)`, "Responses"];
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#475569" }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="46%"
          innerRadius="52%"
          outerRadius="78%"
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <text
          x="50%"
          y="44%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 26, fontWeight: 700, fill: "#0f172a" }}
        >
          {total}
        </text>
        <text
          x="50%"
          y="54%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 11, fill: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          Responses
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
