import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import { acceptInvite, getInviteDetails } from "../../services/teamService";
import { capitalize } from "../../utils/helpers";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [loadError, setLoadError] = useState(
    token ? "" : "This invitation link is missing or incomplete."
  );

  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [accepted, setAccepted] = useState(false);

  // Load the invite details (this endpoint is public)
  useEffect(() => {
    if (!token) return;
    let active = true;

    const run = async () => {
      try {
        const data = await getInviteDetails(token);
        if (active) setInvite(data);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [token]);

  const handleAccept = async () => {
    setActionError("");
    setAccepting(true);
    try {
      await acceptInvite(token);
      setAccepted(true);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setAccepting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Stay on this page; the logged-out view will show login/signup buttons
  };

  // After accepting, reload the app so the user's workspace and role refresh
  const goToDashboard = () => {
    window.location.assign("/dashboard");
  };

  const redirectState = { from: location };

  const emailMatches =
    invite && user && invite.email?.toLowerCase() === user.email?.toLowerCase();

  // ---- Render ----

  if (loading || authLoading) {
    return (
      <Shell>
        <h1 style={styles.title}>Loading invitation...</h1>
        <p style={styles.subtitle}>Please wait a moment.</p>
      </Shell>
    );
  }

  if (loadError) {
    return (
      <Shell>
        <h1 style={styles.title}>Invitation unavailable</h1>
        <div role="alert" style={styles.error}>
          {loadError}
        </div>
        <p style={styles.subtitle}>
          Ask the workspace admin to send you a new invitation.
        </p>
        <Link to="/login" style={styles.buttonLink}>
          Go to log in
        </Link>
      </Shell>
    );
  }

  if (accepted) {
    return (
      <Shell>
        <h1 style={styles.title}>You're in!</h1>
        <p style={styles.subtitle}>
          You joined <strong>{invite.workspaceName}</strong> as{" "}
          <strong>{capitalize(invite.role)}</strong>.
        </p>
        <button type="button" onClick={goToDashboard} style={styles.button}>
          Go to dashboard
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 style={styles.title}>You've been invited</h1>
      <p style={styles.subtitle}>
        {invite.invitedBy ? <strong>{invite.invitedBy}</strong> : "An admin"}{" "}
        invited you to join <strong>{invite.workspaceName}</strong> as{" "}
        <strong>{capitalize(invite.role)}</strong>.
      </p>

      {actionError && (
        <div role="alert" style={styles.error}>
          {actionError}
        </div>
      )}

      {/* Case 1: not logged in */}
      {!isAuthenticated && (
        <>
          <p style={styles.hint}>
            This invitation is for <strong>{invite.email}</strong>. Create your
            account with that email to join the workspace.
          </p>
          <Link
            to={`/signup?invite=${encodeURIComponent(token)}`}
            style={styles.buttonLink}
          >
            Create an account
          </Link>
          <p style={styles.alreadyText}>
            Already have an account with this email?{" "}
            <Link to="/login" state={redirectState} style={styles.textLink}>
              Log in
            </Link>
          </p>
        </>
      )}

      {/* Case 2: logged in with the right email */}
      {isAuthenticated && emailMatches && (
        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting}
          style={{
            ...styles.button,
            ...(accepting ? styles.buttonDisabled : {}),
          }}
        >
          {accepting ? "Joining..." : "Accept invitation"}
        </button>
      )}

      {/* Case 3: logged in with a different email */}
      {isAuthenticated && !emailMatches && (
        <>
          <div style={styles.warning}>
            You're logged in as <strong>{user.email}</strong>, but this
            invitation was sent to <strong>{invite.email}</strong>.
          </div>
          <button type="button" onClick={handleLogout} style={styles.button}>
            Log out and switch account
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={styles.linkButton}
          >
            Back to dashboard
          </button>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span>
          <span style={styles.brandName}>SaaSBoard</span>
        </div>
        {children}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 32,
    boxSizing: "border-box",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  brandName: { fontSize: 18, fontWeight: 700, color: "var(--text)" },
  title: { margin: "0 0 8px", fontSize: 24, color: "var(--text)" },
  subtitle: {
    margin: "0 0 20px",
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  hint: {
    margin: "0 0 16px",
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  warning: {
    background: "var(--warning-bg)",
    border: "1px solid var(--warning-border)",
    color: "var(--warning-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  button: {
    display: "block",
    width: "100%",
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 600,
    color: "#ffffff",
    background: "#4f46e5",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  buttonLink: {
    display: "block",
    textAlign: "center",
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 600,
    color: "#ffffff",
    background: "#4f46e5",
    borderRadius: 8,
    textDecoration: "none",
    boxSizing: "border-box",
  },
  secondaryLink: {
    display: "block",
    textAlign: "center",
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--primary-text)",
    background: "var(--surface)",
    border: "1px solid var(--primary-border)",
    borderRadius: 8,
    textDecoration: "none",
    marginTop: 10,
    boxSizing: "border-box",
  },
  linkButton: {
    display: "block",
    margin: "14px auto 0",
    background: "none",
    border: "none",
    color: "var(--primary-text)",
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "underline",
  },
    alreadyText: {
    margin: "16px 0 0",
    textAlign: "center",
    fontSize: 14,
    color: "var(--text-muted)",
  },
  textLink: { color: "var(--primary-text)", fontWeight: 600, textDecoration: "none" },
};
