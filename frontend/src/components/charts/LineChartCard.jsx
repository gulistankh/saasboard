import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatNumber } from "../../utils/helpers";

// Usage:
// <LineChartCard
//   title="Activity"
//   data={[{ date: "2026-10-01", count: 12 }, ...]}
//   xKey="date"
//   yKey="count"
//   loading={false}
//   action={<select>...</select>}   (optional, e.g. a range picker)
// />
export default function LineChartCard({
  title,
  data = [],
  xKey = "date",
  yKey = "count",
  color = "#4f46e5",
  height = 300,
  loading = false,
  action = null,
}) {
  const hasData = Array.isArray(data) && data.length > 0;

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
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey={xKey}
                tickFormatter={formatDate}
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
                labelFormatter={formatDate}
                formatter={(value) => [formatNumber(value), "Activity"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                }}
              />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
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

