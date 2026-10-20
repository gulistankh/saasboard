import { query as poolQuery } from "../config/db.js";
import env from "../config/env.js";

// Use the transaction client if one is given, otherwise the shared pool
const run = (client, text, params) =>
  client ? client.query(text, params) : poolQuery(text, params);

// Columns that are safe to send to the frontend (never password_hash)
const PUBLIC_COLUMNS = `
  u.id, u.name, u.email, u.role, u.email_verified, u.avatar_file, u.is_demo,
  u.workspace_id, w.name AS workspace_name, u.created_at`;

  export const toAvatarUrl = (file) =>
  file ? `${env.publicUrl}/uploads/avatars/${file}` : null;

// Convert a database row to the object the frontend expects
export const toPublicUser = (row) =>
  row && {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: row.email_verified,
    avatarUrl: toAvatarUrl(row.avatar_file),
    isDemo: row.is_demo,
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name,
    createdAt: row.created_at,
  };


// ---- Create / find users ----

export const createUser = async (
  { name, email, passwordHash, role = "member", workspaceId = null, emailVerified = false },
  client
) => {
  const { rows } = await run(
    client,
    `INSERT INTO users (name, email, password_hash, role, workspace_id, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [name, email, passwordHash, role, workspaceId, emailVerified]
  );
  return rows[0].id;
};

export const findById = async (id, client) => {
  const { rows } = await run(
    client,
    `SELECT ${PUBLIC_COLUMNS}
     FROM users u LEFT JOIN workspaces w ON w.id = u.workspace_id
     WHERE u.id = $1`,
    [id]
  );
  return toPublicUser(rows[0]) || null;
};

// Includes password_hash: only for login and password checks
export const findByEmailWithPassword = async (email, client) => {
  const { rows } = await run(
    client,
    `SELECT ${PUBLIC_COLUMNS}, u.password_hash
     FROM users u LEFT JOIN workspaces w ON w.id = u.workspace_id
     WHERE u.email = $1`,
    [email]
  );
  const row = rows[0];
  if (!row) return null;
  return { ...toPublicUser(row), passwordHash: row.password_hash };
};

export const findPasswordHashById = async (id, client) => {
  const { rows } = await run(
    client,
    "SELECT password_hash FROM users WHERE id = $1",
    [id]
  );
  return rows[0]?.password_hash ?? null;
};

export const emailExists = async (email, client) => {
  const { rows } = await run(
    client,
    "SELECT 1 FROM users WHERE email = $1",
    [email]
  );
  return rows.length > 0;
};

// ---- Update users ----

export const updateName = async (id, name) => {
  await run(null, "UPDATE users SET name = $1 WHERE id = $2", [name, id]);
  return findById(id);
};

export const updatePassword = async (id, passwordHash, client) => {
  await run(client, "UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    id,
  ]);
};

export const markEmailVerified = async (id, client) => {
  await run(client, "UPDATE users SET email_verified = TRUE WHERE id = $1", [id]);
};

export const setWorkspaceAndRole = async (id, workspaceId, role, client) => {
  await run(
    client,
    "UPDATE users SET workspace_id = $1, role = $2 WHERE id = $3",
    [workspaceId, role, id]
  );
};

export const getAvatarFile = async (id) => {
  const { rows } = await run(null, "SELECT avatar_file FROM users WHERE id = $1", [id]);
  return rows[0]?.avatar_file ?? null;
};

export const setAvatarFile = async (id, file) => {
  await run(null, "UPDATE users SET avatar_file = $1 WHERE id = $2", [file, id]);
};

// ---- Email verification tokens (hash stored, never the raw token) ----

export const createEmailVerificationToken = async (userId, tokenHash, expiresAt, client) => {
  // Only one active verification link per user
  await run(client, "DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);
  await run(
    client,
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
};

// Single-use: deletes the token and returns the user id (or null)
export const consumeEmailVerificationToken = async (tokenHash, client) => {
  const { rows } = await run(
    client,
    `DELETE FROM email_verification_tokens
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );
  return rows[0]?.user_id ?? null;
};

// ---- Password reset tokens ----

export const createPasswordResetToken = async (userId, tokenHash, expiresAt, client) => {
  await run(client, "DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
  await run(
    client,
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
};

export const consumePasswordResetToken = async (tokenHash, client) => {
  const { rows } = await run(
    client,
    `DELETE FROM password_reset_tokens
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );
  return rows[0]?.user_id ?? null;
};

// ---- Notification settings (stored on the user_settings table) ----

const DEFAULT_SETTINGS = {
  emailProductUpdates: false,
  emailTeamActivity: true,
  emailSecurityAlerts: true,
};

const toSettings = (row) =>
  row
    ? {
        emailProductUpdates: row.email_product_updates,
        emailTeamActivity: row.email_team_activity,
        emailSecurityAlerts: row.email_security_alerts,
      }
    : { ...DEFAULT_SETTINGS };

export const getSettings = async (userId) => {
  const { rows } = await run(
    null,
    "SELECT * FROM user_settings WHERE user_id = $1",
    [userId]
  );
  return toSettings(rows[0]);
};

// Upsert: creates the row on first save, updates only the sent fields later
export const saveSettings = async (userId, updates) => {
  const current = await getSettings(userId);
  const next = { ...current, ...updates };
  const { rows } = await run(
    null,
    `INSERT INTO user_settings
       (user_id, email_product_updates, email_team_activity, email_security_alerts)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       email_product_updates = EXCLUDED.email_product_updates,
       email_team_activity   = EXCLUDED.email_team_activity,
       email_security_alerts = EXCLUDED.email_security_alerts
     RETURNING *`,
    [
      userId,
      next.emailProductUpdates,
      next.emailTeamActivity,
      next.emailSecurityAlerts,
    ]
  );
  return toSettings(rows[0]);
};
