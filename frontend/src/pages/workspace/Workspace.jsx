import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api, { getErrorMessage } from "../../services/api";
import { formatDate, formatNumber } from "../../utils/helpers";

export default function Workspace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/workspace");
      setWorkspace(data.workspace);
      setName(data.workspace.name);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Workspace name must be at least 2 characters.");
      return;
    }
    if (cleanName.length > 60) {
      setError("Workspace name must be 60 characters or fewer.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch("/workspace", { name: cleanName });
      setWorkspace((prev) => ({ ...prev, ...data.workspace }));
      setName(data.workspace.name);
      setSuccess("Workspace updated.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");
    setDeleting(true);
    try {
      await api.delete("/workspace");
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  const unchanged = workspace && name.trim() === workspace.name;
  const canDelete = workspace && confirmText === workspace.name;
  const isOwner = workspace && workspace.ownerId === user?.id;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Workspace</h2>
        <p style={styles.subheading}>
          Manage your workspace details and settings.
        </p>
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : !workspace ? (
        <button type="button" onClick={loadWorkspace} style={styles.primaryButton}>
          Try again
        </button>
      ) : (
        <>
          {/* General */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>General</h3>
            <form onSubmit={handleSave} noValidate>
              <label style={styles.label} htmlFor="workspaceName">
                Workspace name
              </label>
              <input
                id="workspaceName"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                style={styles.input}
              />
              <button
                type="submit"
                disabled={saving || unchanged}
                style={{
                  ...styles.primaryButton,
                  ...(saving || unchanged ? styles.disabled : {}),
                }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>

          {/* Info */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Details</h3>
            <div style={styles.infoGrid}>
              <div>
                <div style={styles.infoLabel}>Members</div>
                <div style={styles.infoValue}>
                  {formatNumber(workspace.memberCount)}
                </div>
              </div>
              <div>
                <div style={styles.infoLabel}>Created</div>
                <div style={styles.infoValue}>
                  {formatDate(workspace.createdAt)}
                </div>
              </div>
              <div>
                <div style={styles.infoLabel}>Owner</div>
                <div style={styles.infoValue}>{workspace.ownerName || "-"}</div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          {/* Danger zone: only the owner can delete the workspace */}
          {isOwner && (
          <div style={styles.dangerPanel}>
            <h3 style={{ ...styles.panelTitle, color: "var(--error-text)" }}>
              Danger zone
            </h3>
            <p style={styles.dangerText}>
              Deleting this workspace permanently removes all its projects,
              tasks, members and invites. This cannot be undone.
            </p>
            <label style={styles.label} htmlFor="confirmDelete">
              Type <strong>{workspace.name}</strong> to confirm
            </label>
            <input
              id="confirmDelete"
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              style={styles.input}
            />
            <button
              type="button"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
              style={{
                ...styles.dangerButton,
                ...(!canDelete || deleting ? styles.disabled : {}),
              }}
            >
              {deleting ? "Deleting..." : "Delete workspace"}
            </button>
          </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  heading: { margin: 0, fontSize: 24, color: "var(--text)" },
  subheading: { margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" },
  muted: { margin: 0, fontSize: 14, color: "var(--text-muted)" },
  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  success: {
    background: "var(--success-bg)",
    border: "1px solid var(--success-border)",
    color: "var(--success-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    maxWidth: 640,
  },
  dangerPanel: {
    background: "var(--surface)",
    border: "1px solid var(--error-border)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    maxWidth: 640,
  },
  panelTitle: { margin: "0 0 16px", fontSize: 16, color: "var(--text)" },
  dangerText: {
    margin: "0 0 16px",
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-2)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    marginBottom: 16,
    outline: "none",
    boxSizing: "border-box",
  },
  primaryButton: {
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    background: "#4f46e5",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  dangerButton: {
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    background: "#dc2626",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16,
  },
  infoLabel: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 600, color: "var(--text)" },
};
