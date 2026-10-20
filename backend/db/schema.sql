-- SaaSBoard schema (PostgreSQL 13+)
-- gen_random_uuid() is built in from PostgreSQL 13.

-- ---------- Workspaces ----------
-- owner_id gets its foreign key later, because users and workspaces
-- reference each other.
CREATE TABLE IF NOT EXISTS workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(60) NOT NULL,
  owner_id   UUID,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(254) NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,
  email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  role           VARCHAR(10)  NOT NULL DEFAULT 'member'
                 CHECK (role IN ('admin', 'member')),
  workspace_id   UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_owner_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);

-- ---------- Sessions and one-time tokens (only hashes are stored) ----------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Settings ----------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_product_updates BOOLEAN NOT NULL DEFAULT FALSE,
  email_team_activity   BOOLEAN NOT NULL DEFAULT TRUE,
  email_security_alerts BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- Invites ----------
CREATE TABLE IF NOT EXISTS invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email        VARCHAR(254) NOT NULL,
  role         VARCHAR(10)  NOT NULL DEFAULT 'member'
               CHECK (role IN ('admin', 'member')),
  token_hash   TEXT NOT NULL UNIQUE,
  invited_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invites_workspace ON invites(workspace_id);

-- ---------- Dashboard data ----------
CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(120) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'planning'
               CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_workspace ON activity_log(workspace_id, created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file VARCHAR(100);