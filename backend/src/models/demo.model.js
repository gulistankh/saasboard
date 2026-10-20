import crypto from "crypto";
import { query, withTransaction } from "../config/db.js";

const PROJECTS = [
  ["Website Redesign", "in_progress"],
  ["Mobile App Launch", "in_progress"],
  ["Customer Portal", "planning"],
  ["Marketing Campaign Q4", "completed"],
  ["API Integration", "on_hold"],
  ["Analytics Overhaul", "in_progress"],
];

// Creates a complete demo workspace in one transaction. Returns the admin's id.
export const createDemoWorkspace = (passwordHash) =>
  withTransaction(async (client) => {
    const key = crypto.randomUUID();

    const ws = await client.query(
      `INSERT INTO workspaces (name, is_demo) VALUES ('Demo Workspace', TRUE) RETURNING id`
    );
    const workspaceId = ws.rows[0].id;

    const admin = await client.query(
      `INSERT INTO users (name, email, password_hash, role, workspace_id, email_verified, is_demo)
       VALUES ('Demo Admin', $1, $2, 'admin', $3, TRUE, TRUE)
       RETURNING id`,
      [`demo-${key}@demo.invalid`, passwordHash, workspaceId]
    );
    const userId = admin.rows[0].id;

    await client.query("UPDATE workspaces SET owner_id = $1 WHERE id = $2", [
      userId,
      workspaceId,
    ]);

    // Teammates, so the Team page has people in it
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, workspace_id, email_verified, is_demo)
       SELECT t.n, 'demo-' || $1::text || '-' || t.i::text || '@demo.invalid',
              $2, t.r, $3, TRUE, TRUE
       FROM unnest($4::text[], $5::text[]) WITH ORDINALITY AS t(n, r, i)`,
      [
        key,
        passwordHash,
        workspaceId,
        ["Sara Ahmed", "Omar Khalid", "Lina Hassan"],
        ["member", "member", "admin"],
      ]
    );

    await client.query(
      `INSERT INTO projects (workspace_id, name, status, created_at)
       SELECT $1, t.n, t.s, NOW() - (t.i::int * INTERVAL '9 days')
       FROM unnest($2::text[], $3::text[]) WITH ORDINALITY AS t(n, s, i)`,
      [workspaceId, PROJECTS.map((p) => p[0]), PROJECTS.map((p) => p[1])]
    );

    await client.query(
      `INSERT INTO tasks (workspace_id, project_id, title, status, created_at)
       SELECT p.workspace_id, p.id,
              (ARRAY['Write requirements','Design mockups','Set up environment',
                     'Build core feature','Code review','Write tests',
                     'Fix reported bugs','Update documentation'])[j],
              CASE
                WHEN p.status = 'completed' THEN 'done'
                WHEN p.status = 'planning'  THEN (CASE WHEN j <= 6 THEN 'todo' ELSE 'in_progress' END)
                ELSE (ARRAY['todo','in_progress','review','done'])[1 + ((j + p.rn::int) % 4)]
              END,
              NOW() - ((j + p.rn::int) * INTERVAL '1 day')
       FROM (
         SELECT id, workspace_id, status,
                ROW_NUMBER() OVER (ORDER BY created_at) AS rn
         FROM projects WHERE workspace_id = $1
       ) p
       CROSS JOIN generate_series(1, 8) AS j`,
      [workspaceId]
    );

    await client.query(
      `INSERT INTO activity_log (workspace_id, user_id, action, created_at)
       SELECT $1, $2,
              (ARRAY['completed task "Build core feature"',
                     'created project "Customer Portal"',
                     'commented on "Design mockups"',
                     'moved "Write tests" to review',
                     'updated project "Website Redesign"',
                     'closed 3 bug reports'])[1 + floor(random() * 6)::int],
              NOW() - (d * INTERVAL '1 day')
                    - (floor(random() * 600) * INTERVAL '1 minute')
       FROM generate_series(0, 89) AS d
       CROSS JOIN generate_series(1, 5) AS k
       WHERE random() < 0.5`,
      [workspaceId, userId]
    );

    await client.query(
      `INSERT INTO activity_log (workspace_id, user_id, action, created_at)
       VALUES ($1, $2, 'opened the demo workspace', NOW()),
              ($1, $2, 'completed task "Update documentation"', NOW() - INTERVAL '2 hours')`,
      [workspaceId, userId]
    );

    return userId;
  });

export const countDemoWorkspaces = async () => {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS count FROM workspaces WHERE is_demo"
  );
  return rows[0].count;
};

// Removes demo workspaces older than 24 hours, with everything inside them
export const deleteExpiredDemos = () =>
  withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id FROM workspaces
       WHERE is_demo AND created_at < NOW() - INTERVAL '24 hours'`
    );
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return 0;

    await client.query(
      "UPDATE workspaces SET owner_id = NULL WHERE id = ANY($1::uuid[])",
      [ids]
    );
    await client.query("DELETE FROM users WHERE workspace_id = ANY($1::uuid[])", [ids]);
    await client.query("DELETE FROM workspaces WHERE id = ANY($1::uuid[])", [ids]);
    return ids.length;
  });