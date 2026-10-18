import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./CategoryCharts";

type DemographicChartProps = {
  data: { group: string; [key: string]: string | number }[];
  tools: string[];
};

export function DemographicChart({ data, tools }: DemographicChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="group"
          tick={{ fill: "#475569", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
          unit="%"
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            fontSize: 13,
          }}
          formatter={(value: number) => [`${value}%`, ""]}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#475569" }}
        />
        {tools.map((tool, i) => (
          <Bar
            key={tool}
            dataKey={tool}
            stackId="tools"
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={i === tools.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
