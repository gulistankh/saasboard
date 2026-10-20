import { query } from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

// ---- GET /dashboard/stats ----
export const getStats = asyncHandler(async (req, res) => {
  const { workspaceId } = req.user;

  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM projects WHERE workspace_id = $1) AS total_projects,
       (SELECT COUNT(*)::int FROM tasks
          WHERE workspace_id = $1 AND status <> 'done') AS active_tasks,
       (SELECT COUNT(*)::int FROM tasks
          WHERE workspace_id = $1 AND status = 'done') AS completed_tasks,
       (SELECT COUNT(*)::int FROM users WHERE workspace_id = $1) AS team_members`,
    [workspaceId]
  );

  const row = rows[0];
  res.json({
    stats: {
      totalProjects: row.total_projects,
      activeTasks: row.active_tasks,
      completedTasks: row.completed_tasks,
      teamMembers: row.team_members,
    },
  });
});

// ---- GET /dashboard/activity?range=30d ----
// One row per day, including days with zero activity, so the line is continuous
export const getActivity = asyncHandler(async (req, res) => {
  const days = RANGE_DAYS[req.query.range] || 30;

  const { rows } = await query(
    `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
            COUNT(a.id)::int AS count
     FROM generate_series(
            CURRENT_DATE - ($2::int - 1),
            CURRENT_DATE,
            INTERVAL '1 day'
          ) AS d(day)
     LEFT JOIN activity_log a
       ON a.workspace_id = $1
      AND a.created_at >= d.day
      AND a.created_at <  d.day + INTERVAL '1 day'
     GROUP BY d.day
     ORDER BY d.day`,
    [req.user.workspaceId, days]
  );

  res.json({ activity: rows });
});

// ---- GET /dashboard/tasks-by-status ----
export const getTasksByStatus = asyncHandler(async (req, res) => {
  // Fixed order, and statuses with no tasks still appear with count 0
  const { rows } = await query(
    `SELECT s.status, COUNT(t.id)::int AS count
     FROM (VALUES ('todo', 1), ('in_progress', 2), ('review', 3), ('done', 4))
          AS s(status, position)
     LEFT JOIN tasks t
       ON t.status = s.status AND t.workspace_id = $1
     GROUP BY s.status, s.position
     ORDER BY s.position`,
    [req.user.workspaceId]
  );

  res.json({ tasks: rows });
});

// ---- GET /dashboard/recent?limit=10 ----
export const getRecentActivity = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT a.id, a.action, a.created_at, COALESCE(u.name, 'Someone') AS user_name
     FROM activity_log a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.workspace_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [req.user.workspaceId, req.query.limit]
  );

  res.json({
    items: rows.map((row) => ({
      id: row.id,
      userName: row.user_name,
      action: row.action,
      createdAt: row.created_at,
    })),
  });
});

// ---- GET /dashboard/projects ----
// progress = percentage of the project's tasks that are done (0 if no tasks)
export const getProjects = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.name, p.status,
            CASE WHEN COUNT(t.id) = 0 THEN 0
                 ELSE ROUND(100.0 * COUNT(t.id) FILTER (WHERE t.status = 'done') / COUNT(t.id))
            END::int AS progress
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.workspace_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [req.user.workspaceId]
  );

  res.json({ projects: rows });
});