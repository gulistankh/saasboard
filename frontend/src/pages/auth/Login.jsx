import { Lock, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import IconInput from "../../components/ui/IconInput";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import { resendVerification } from "../../services/authService";
import { isValidEmail } from "../../utils/helpers";

export default function Login() {
  const { login, startDemo, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after login (set by ProtectedRoute), default: dashboard
  const redirectTo = location.state?.from
    ? location.state.from.pathname + (location.state.from.search || "")
    : "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Already logged in: don't show the login form
  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setNeedsVerification(false);

    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // The backend answers 403 when the email is not verified yet
      if (err.response?.status === 403) {
        setNeedsVerification(true);
      }
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      await resendVerification(form.email.trim());
      setInfo("Verification email sent. Please check your inbox.");
      setNeedsVerification(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDemo = async () => {
    setError("");
    setInfo("");
    setDemoLoading(true);
    try {
      await startDemo();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setDemoLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span>
          <span style={styles.brandName}>SaaSBoard</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Log in to your account to continue.</p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}
        {info && <div style={styles.success}>{info}</div>}

        {needsVerification && (
          <button type="button" onClick={handleResend} style={styles.linkButton}>
            Resend verification email
          </button>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <IconInput
            id="email"
            name="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
          />

          <div style={styles.labelRow}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" style={styles.smallLink}>
              Forgot password?
            </Link>
          </div>
          <IconInput
            id="password"
            name="password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="Your password"
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.line} />
          <span>or</span>
          <span style={styles.line} />
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading}
          style={{
            ...styles.demoButton,
            ...(demoLoading ? styles.buttonDisabled : {}),
          }}
        >
          <Sparkles size={16} aria-hidden="true" />
          {demoLoading ? "Preparing your demo..." : "Try the demo"}
        </button>
        <p style={styles.demoHint}>
          {demoLoading
            ? "The server may take up to a minute to wake up on the first visit."
            : "No sign-up needed. Explore with sample data."}
        </p>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.footerLink}>
            Sign up
          </Link>
        </p>
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
    maxWidth: 400,
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
  title: { margin: "0 0 4px", fontSize: 24, color: "var(--text)" },
  subtitle: { margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)" },
  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  success: {
    background: "var(--success-bg)",
    border: "1px solid var(--success-border)",
    color: "var(--success-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "var(--primary-text)",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
    marginBottom: 12,
    textDecoration: "underline",
  },
  form: { display: "flex", flexDirection: "column" },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-2)",
    marginBottom: 6,
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallLink: {
    fontSize: 13,
    color: "var(--primary-text)",
    textDecoration: "none",
  },
  button: {
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 600,
    color: "#ffffff",
    background: "#4f46e5",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0 16px",
    fontSize: 13,
    color: "var(--text-muted)",
  },
  line: { flex: 1, height: 1, background: "var(--border)" },
  demoButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--primary-text)",
    background: "var(--primary-soft)",
    border: "1px solid var(--primary-border)",
    borderRadius: 8,
    cursor: "pointer",
  },
  demoHint: {
    margin: "8px 0 0",
    textAlign: "center",
    fontSize: 12,
    color: "var(--text-muted)",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "var(--text-muted)",
  },
  footerLink: {
    color: "var(--primary-text)",
    fontWeight: 600,
    textDecoration: "none",
  },
};