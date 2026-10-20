import api from "./api";

// Summary cards: total projects, active tasks, completed tasks, team size...
export const getStats = async () => {
  const { data } = await api.get("/dashboard/stats");
  return data.stats;
};

// Line chart: activity over time. range: "7d" | "30d" | "90d"
export const getActivity = async (range = "30d") => {
  const { data } = await api.get("/dashboard/activity", { params: { range } });
  return data.activity;
};

// Bar chart: tasks grouped by status (todo, in progress, done...)
export const getTasksByStatus = async () => {
  const { data } = await api.get("/dashboard/tasks-by-status");
  return data.tasks;
};

// Recent activity feed: who did what, and when
export const getRecentActivity = async (limit = 10) => {
  const { data } = await api.get("/dashboard/recent", { params: { limit } });
  return data.items;
};

// Projects list with progress, shown in a table on the dashboard
export const getProjects = async () => {
  const { data } = await api.get("/dashboard/projects");
  return data.projects;
};
