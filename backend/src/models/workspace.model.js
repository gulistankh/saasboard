import { query as poolQuery } from "../config/db.js";

// Use the transaction client if one is given, otherwise the shared pool
const run = (client, text, params) =>
  client ? client.query(text, params) : poolQuery(text, params);

// ---- Workspaces ----

export const createWorkspace = async (name, ownerId, client) => {
  const { rows } = await run(
    client,
    `INSERT INTO workspaces (name, owner_id)
     VALUES ($1, $2)
     RETURNING id`,
    [name, ownerId]
  );
  return rows[0].id;
};

// Signup creates the user and workspace together. The workspace needs the
// owner id and the user needs the workspace id, so the owner is set after.
export const setOwner = async (workspaceId, ownerId, client) => {
  await run(client, "UPDATE workspaces SET owner_id = $1 WHERE id = $2", [
    ownerId,
    workspaceId,
  ]);
};

// Shape the frontend's Workspace page expects
export const findById = async (id, client) => {
  const { rows } = await run(
    client,
    `SELECT w.id, w.name, w.created_at, w.owner_id,
            owner.name AS owner_name,
            (SELECT COUNT(*)::int FROM users WHERE workspace_id = w.id) AS member_count
     FROM workspaces w
     LEFT JOIN users owner ON owner.id = w.owner_id
     WHERE w.id = $1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    memberCount: row.member_count,
    createdAt: row.created_at,
  };
};

export const rename = async (id, name) => {
  await run(null, "UPDATE workspaces SET name = $1 WHERE id = $2", [name, id]);
  return findById(id);
};

// Deletes the workspace and everything inside it. Call this inside a
// transaction. Users are removed too (they belong to this workspace only).
// Child tables (projects, tasks, invites, activity) cascade from workspaces.
export const deleteWorkspace = async (id, client) => {
  // The owner_id foreign key and the users.workspace_id foreign key point at
  // each other, so clear the owner first, then delete the users, then the workspace.
  await run(client, "UPDATE workspaces SET owner_id = NULL WHERE id = $1", [id]);
  await run(client, "DELETE FROM users WHERE workspace_id = $1", [id]);
  await run(client, "DELETE FROM workspaces WHERE id = $1", [id]);
};

// ---- Members ----

export const listMembers = async (workspaceId) => {
  const { rows } = await run(
    null,
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE workspace_id = $1
     ORDER BY (role = 'admin') DESC, name ASC`,
    [workspaceId]
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    joinedAt: row.created_at,
  }));
};

// Always filter by workspace, so an admin can never touch another workspace's users
export const findMember = async (workspaceId, memberId, client) => {
  const { rows } = await run(
    client,
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1 AND workspace_id = $2`,
    [memberId, workspaceId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    joinedAt: row.created_at,
  };
};

export const updateMemberRole = async (workspaceId, memberId, role, client) => {
  await run(
    client,
    "UPDATE users SET role = $1 WHERE id = $2 AND workspace_id = $3",
    [role, memberId, workspaceId]
  );
  return findMember(workspaceId, memberId, client);
};

// Removing a member deletes their account (each user belongs to one workspace)
export const removeMember = async (workspaceId, memberId, client) => {
  await run(client, "DELETE FROM users WHERE id = $1 AND workspace_id = $2", [
    memberId,
    workspaceId,
  ]);
};

export const countAdmins = async (workspaceId, client) => {
  const { rows } = await run(
    client,
    "SELECT COUNT(*)::int AS count FROM users WHERE workspace_id = $1 AND role = 'admin'",
    [workspaceId]
  );
  return rows[0].count;
};

// Row lock used inside a transaction, so two admins can't demote each
// other at the same moment and leave the workspace with no admin
export const lockAdmins = async (workspaceId, client) => {
  await run(
    client,
    "SELECT id FROM users WHERE workspace_id = $1 AND role = 'admin' FOR UPDATE",
    [workspaceId]
  );
};
