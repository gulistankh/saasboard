import { query as poolQuery } from "../config/db.js";

// Use the transaction client if one is given, otherwise the shared pool
const run = (client, text, params) =>
  client ? client.query(text, params) : poolQuery(text, params);

// Shape the frontend's Team page expects
const toInvite = (row) =>
  row && {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };

// ---- Create ----

export const createInvite = async (
  { workspaceId, email, role, tokenHash, invitedBy, expiresAt },
  client
) => {
  const { rows } = await run(
    client,
    `INSERT INTO invites (workspace_id, email, role, token_hash, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, role, created_at`,
    [workspaceId, email, role, tokenHash, invitedBy, expiresAt]
  );
  return toInvite(rows[0]);
};

// ---- Read ----

// Pending = not accepted and not expired. Used by the Team page.
export const listPending = async (workspaceId) => {
  const { rows } = await run(
    null,
    `SELECT id, email, role, created_at
     FROM invites
     WHERE workspace_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [workspaceId]
  );
  return rows.map(toInvite);
};

// Always filter by workspace so an admin can't touch another workspace's invites
export const findById = async (workspaceId, inviteId, client) => {
  const { rows } = await run(
    client,
    `SELECT id, email, role, created_at
     FROM invites
     WHERE id = $1 AND workspace_id = $2`,
    [inviteId, workspaceId]
  );
  return toInvite(rows[0]) || null;
};

// Is there already a live invite for this email in this workspace?
export const pendingExistsForEmail = async (workspaceId, email, client) => {
  const { rows } = await run(
    client,
    `SELECT 1 FROM invites
     WHERE workspace_id = $1 AND email = $2 AND expires_at > NOW()`,
    [workspaceId, email]
  );
  return rows.length > 0;
};

// Public lookup by token (the AcceptInvite page). Returns only what that
// page needs: no ids, no workspace internals.
export const findDetailsByTokenHash = async (tokenHash, client) => {
  const { rows } = await run(
    client,
    `SELECT i.email, i.role, w.name AS workspace_name, u.name AS invited_by
     FROM invites i
     JOIN workspaces w ON w.id = i.workspace_id
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE i.token_hash = $1 AND i.expires_at > NOW()`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    email: row.email,
    role: row.role,
    workspaceName: row.workspace_name,
    invitedBy: row.invited_by,
  };
};

// ---- Update / delete ----

// "Resend" issues a fresh token and a fresh expiry; the old link stops working.
// Returns the invite plus what the email needs, or null if it doesn't exist.
export const refreshToken = async (
  workspaceId,
  inviteId,
  tokenHash,
  expiresAt,
  client
) => {
  const { rows } = await run(
    client,
    `UPDATE invites
     SET token_hash = $1, expires_at = $2
     WHERE id = $3 AND workspace_id = $4
     RETURNING id, email, role, created_at`,
    [tokenHash, expiresAt, inviteId, workspaceId]
  );
  return toInvite(rows[0]) || null;
};

export const revoke = async (workspaceId, inviteId, client) => {
  const { rowCount } = await run(
    client,
    "DELETE FROM invites WHERE id = $1 AND workspace_id = $2",
    [inviteId, workspaceId]
  );
  return rowCount > 0;
};

// Single-use: deletes the invite and returns it (or null if the token is
// unknown or expired). The DELETE is atomic, so two requests can't both accept it.
// Call this inside a transaction, so if joining the workspace fails afterwards,
// the invite is restored by the rollback.
export const consumeByTokenHash = async (tokenHash, client) => {
  const { rows } = await run(
    client,
    `DELETE FROM invites
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING workspace_id, email, role`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  return { workspaceId: row.workspace_id, email: row.email, role: row.role };
};

// Housekeeping: remove expired invites (called from server.js on a timer)
export const deleteExpired = async () => {
  await run(null, "DELETE FROM invites WHERE expires_at < NOW()");
};
