import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api, { getErrorMessage } from "../../services/api";
import { capitalize } from "../../utils/helpers";
import { getStoredTheme, setTheme as saveTheme } from "../../utils/theme";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const NOTIFICATION_OPTIONS = [
  {
    key: "emailProductUpdates",
    label: "Product updates",
    description: "News about new features and improvements.",
  },
  {
    key: "emailTeamActivity",
    label: "Team activity",
    description: "Emails when someone joins or changes your workspace.",
  },
  {
    key: "emailSecurityAlerts",
    label: "Security alerts",
    description: "Important notices about your account security.",
  },
];

const DEFAULT_NOTIFICATIONS = {
  emailProductUpdates: false,
  emailTeamActivity: true,
  emailSecurityAlerts: true,
};



export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ---- Appearance (browser only) ----
  const [theme, setTheme] = useState(getStoredTheme);

    const handleThemeChange = (value) => {
    setTheme(value);
    saveTheme(value);
  };

  // ---- Notifications (saved on the server) ----
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await api.get("/users/me/settings");
        if (active) {
          setNotifications({ ...DEFAULT_NOTIFICATIONS, ...data.settings });
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoadingPrefs(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = (key) => {
    setSuccess("");
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrefs = async () => {
    setError("");
    setSuccess("");
    setSavingPrefs(true);
    try {
      const { data } = await api.patch("/users/me/settings", notifications);
      setNotifications({ ...DEFAULT_NOTIFICATIONS, ...data.settings });
      setSuccess("Notification preferences saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingPrefs(false);
    }
  };

  // ---- Security ----
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Settings</h2>
        <p style={styles.subheading}>Customize how SaaSBoard works for you.</p>
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}

      {/* Appearance */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Appearance</h3>
        <div style={styles.themeRow} role="radiogroup" aria-label="Theme">
          {THEMES.map((item) => {
            const active = theme === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleThemeChange(item.value)}
                style={{
                  ...styles.themeButton,
                  ...(active ? styles.themeButtonActive : {}),
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <p style={styles.hint}>Saved on this device only.</p>
      </div>

      {/* Notifications */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Email notifications</h3>

        {loadingPrefs ? (
          <p style={styles.muted}>Loading...</p>
        ) : (
          <>
            <ul style={styles.list}>
              {NOTIFICATION_OPTIONS.map((option) => (
                <li key={option.key} style={styles.listItem}>
                  <div>
                    <div style={styles.optionLabel}>{option.label}</div>
                    <div style={styles.optionDescription}>
                      {option.description}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    aria-label={option.label}
                    checked={Boolean(notifications[option.key])}
                    onChange={() => handleToggle(option.key)}
                    style={styles.checkbox}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              style={{
                ...styles.primaryButton,
                ...(savingPrefs ? styles.disabled : {}),
              }}
            >
              {savingPrefs ? "Saving..." : "Save preferences"}
            </button>
          </>
        )}
      </div>

      {/* Account + Security */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Account</h3>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Email</span>
          <span style={styles.infoValue}>{user?.email}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Role</span>
          <span style={styles.infoValue}>{capitalize(user?.role)}</span>
        </div>

        <div style={styles.divider} />

        <h3 style={styles.panelTitle}>Security</h3>
        <p style={styles.muted}>
          To change your password, go to your Profile page.
        </p>
        <button type="button" onClick={handleLogout} style={styles.outlineButton}>
          Log out of this device
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  heading: { margin: 0, fontSize: 24, color: "var(--text)" },
  subheading: { margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" },
  muted: { margin: "0 0 16px", fontSize: 14, color: "var(--text-muted)" },
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
  panelTitle: { margin: "0 0 16px", fontSize: 16, color: "var(--text)" },
  themeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  themeButton: {
    padding: "8px 16px",
    fontSize: 14,
    color: "var(--text-2)",
    background: "var(--surface)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    cursor: "pointer",
  },
  themeButtonActive: {
    color: "var(--primary-text)",
    background: "var(--primary-soft)",
    bordercolor: "var(--primary-text)",
    fontWeight: 600,
  },
  hint: { margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)" },
  list: { listStyle: "none", margin: "0 0 16px", padding: 0 },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid var(--surface-2)",
  },
  optionLabel: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  optionDescription: { fontSize: 13, color: "var(--text-muted)", marginTop: 2 },
  checkbox: { width: 18, height: 18, cursor: "pointer", flexShrink: 0 },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: 14,
  },
  infoLabel: { color: "var(--text-muted)" },
  infoValue: { color: "var(--text)", fontWeight: 500 },
  divider: { height: 1, background: "var(--surface-2)", margin: "16px 0" },
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
  outlineButton: {
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-2)",
    background: "var(--surface)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    cursor: "pointer",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};
