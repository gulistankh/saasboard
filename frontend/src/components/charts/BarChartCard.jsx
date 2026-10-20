import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { capitalize, formatNumber } from "../../utils/helpers";

// Usage:
// <BarChartCard
//   title="Tasks by status"
//   data={[{ status: "todo", count: 8 }, ...]}
//   xKey="status"
//   yKey="count"
//   loading={false}
// />
export default function BarChartCard({
  title,
  data = [],
  xKey = "status",
  yKey = "count",
  color = "#4f46e5",
  height = 300,
  loading = false,
  action = null,
}) {
  const hasData = Array.isArray(data) && data.length > 0;

  // "in_progress" -> "In progress"
  const formatLabel = (value) => capitalize(String(value).replace(/_/g, " "));

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>{title}</h3>
        {action}
      </div>

      <div style={{ width: "100%", height }}>
        {loading ? (
          <div style={centerStyle}>Loading chart...</div>
        ) : !hasData ? (
          <div style={centerStyle}>No data to show yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey={xKey}
                tickFormatter={formatLabel}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tickFormatter={formatNumber}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                labelFormatter={formatLabel}
                formatter={(value) => [formatNumber(value), "Tasks"]}
                cursor={{ fill: "var(--surface-2)" }}
                  contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                }}
              />
              <Bar
                dataKey={yKey}
                fill={color}
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const centerStyle = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
  fontSize: 14,
};