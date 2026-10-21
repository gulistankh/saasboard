import Select from "../../components/ui/Select";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FolderKanban, ListTodo, Users } from "lucide-react";
import BarChartCard from "../../components/charts/BarChartCard";
import LineChartCard from "../../components/charts/LineChartCard";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import {
  getActivity,
  getProjects,
  getRecentActivity,
  getStats,
  getTasksByStatus,
} from "../../services/dashboardService";
import {
  capitalize,
  formatDateTime,
  formatNumber,
} from "../../utils/helpers";

const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const STAT_CARDS = [
  { key: "totalProjects", label: "Total projects", icon: FolderKanban },
  { key: "activeTasks", label: "Active tasks", icon: ListTodo },
  { key: "completedTasks", label: "Completed tasks", icon: CheckCircle2 },
  { key: "teamMembers", label: "Team members", icon: Users },
];

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [projects, setProjects] = useState([]);
  const [range, setRange] = useState("30d");

  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");

  // Load everything except the activity chart (it depends on the range)
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, tasksData, recentData, projectsData] =
        await Promise.all([
          getStats(),
          getTasksByStatus(),
          getRecentActivity(8),
          getProjects(),
        ]);
      setStats(statsData);
      setTasks(tasksData);
      setRecent(recentData);
      setProjects(projectsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Reload only the line chart when the range changes
  useEffect(() => {
    let active = true;
    setActivityLoading(true);

    getActivity(range)
      .then((data) => {
        if (active) setActivity(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [range]);

  const rangePicker = (
    <Select
      ariaLabel="Select time range"
      value={range}
      onChange={setRange}
      options={RANGES}
      width={150}
    />
  );

  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Welcome back{firstName && `, ${firstName}`}!</h2>
        <p style={styles.subheading}>
          Here's what's happening in your workspace.
        </p>
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}{" "}
          <button type="button" onClick={loadDashboard} style={styles.retry}>
            Try again
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        {STAT_CARDS.map((card) => (
          <div key={card.key} style={styles.statCard}>
              <div style={styles.statIcon} aria-hidden="true">
              <card.icon size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>{card.label}</div>
              <div style={styles.statValue}>
                {loading ? "..." : formatNumber(stats?.[card.key])}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>
        <LineChartCard
          title="Activity"
          data={activity}
          xKey="date"
          yKey="count"
          loading={activityLoading}
          action={rangePicker}
        />
        <BarChartCard
          title="Tasks by status"
          data={tasks}
          xKey="status"
          yKey="count"
          loading={loading}
        />
      </div>

      {/* Recent activity + projects */}
      <div style={styles.bottomGrid}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Recent activity</h3>
          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : recent.length === 0 ? (
            <p style={styles.muted}>No recent activity yet.</p>
          ) : (
            <ul style={styles.feed}>
              {recent.map((item) => (
                <li key={item.id} style={styles.feedItem}>
                  <div style={styles.feedText}>
                    <strong>{item.userName}</strong> {item.action}
                  </div>
                  <div style={styles.feedTime}>
                    {formatDateTime(item.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Projects</h3>
          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : projects.length === 0 ? (
            <p style={styles.muted}>No projects yet.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td style={styles.td}>{project.name}</td>
                      <td style={styles.td}>
                        {capitalize(String(project.status).replace(/_/g, " "))}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressBar,
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(project.progress) || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <span style={styles.progressText}>
                          {Number(project.progress) || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  heading: { margin: 0, fontSize: 24, color: "var(--text)" },
  subheading: { margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" },
  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  retry: {
    background: "none",
    border: "none",
    color: "var(--error-text)",
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "var(--primary-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  statLabel: { fontSize: 13, color: "var(--text-muted)" },
  statValue: { fontSize: 24, fontWeight: 700, color: "var(--text)" },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
  },
  panelTitle: { margin: "0 0 16px", fontSize: 16, color: "var(--text)" },
  muted: { margin: 0, fontSize: 14, color: "var(--text-muted)" },
  feed: { listStyle: "none", margin: 0, padding: 0 },
  feedItem: {
    padding: "10px 0",
    borderBottom: "1px solid var(--surface-2)",
  },
  feedText: { fontSize: 14, color: "var(--text-2)" },
  feedTime: { fontSize: 12, color: "var(--text-faint)", marginTop: 2 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    padding: "8px 8px",
    borderBottom: "1px solid var(--border)",
  },
  td: {
    fontSize: 14,
    color: "var(--text-2)",
    padding: "10px 8px",
    borderBottom: "1px solid var(--surface-2)",
    verticalAlign: "middle",
  },
  progressTrack: {
    display: "inline-block",
    width: 80,
    height: 6,
    background: "var(--border)",
    borderRadius: 999,
    overflow: "hidden",
    verticalAlign: "middle",
    marginRight: 8,
  },
  progressBar: { height: "100%", background: "#4f46e5" },
  progressText: { fontSize: 12, color: "var(--text-muted)" },
  
    statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "var(--primary-soft)",
    color: "var(--primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
