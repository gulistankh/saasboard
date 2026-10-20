import { Lock } from "lucide-react";
import IconInput from "../../components/ui/IconInput";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../services/api";
import { resetPassword } from "../../services/authService";
import { getPasswordError } from "../../utils/helpers";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [tokenProblem, setTokenProblem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setTokenProblem(false);

    const passwordError = getPasswordError(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ token, password: form.password });
      setDone(true);
    } catch (err) {
      // 400 with an invalid/expired link message means the token is the problem.
      // Validation errors (weak password) must not show the "new link" option.
      const message = getErrorMessage(err);
      setTokenProblem(/link/i.test(message));
      setError(message);
    }finally {
      setSubmitting(false);
    }
  };

  // No token in the URL: the link is broken or was opened manually
  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <Brand />
          <h1 style={styles.title}>Invalid reset link</h1>
          <p style={styles.subtitle}>
            This link is missing or incomplete. Please request a new one.
          </p>
          <Link to="/forgot-password" style={styles.buttonLink}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  // Success screen
  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <Brand />
          <h1 style={styles.title}>Password updated</h1>
          <p style={styles.subtitle}>
            Your password has been changed. You can now log in with it.
          </p>
          <Link to="/login" style={styles.buttonLink}>
            Go to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Brand />

        <h1 style={styles.title}>Set a new password</h1>
        <p style={styles.subtitle}>Choose a strong password for your account.</p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
            {tokenProblem && (
              <>
                {" "}
                <Link to="/forgot-password" style={styles.errorLink}>
                  Request a new link
                </Link>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <label style={styles.label} htmlFor="password">
            New password
          </label>
          <IconInput
            id="password"
            name="password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
          />
          <p style={styles.hint}>Use 8+ characters with a letter and a number.</p>

          <label style={styles.label} htmlFor="confirmPassword">
            Confirm new password
          </label>
          <IconInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
          >
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>

        <p style={styles.footer}>
          <Link to="/login" style={styles.footerLink}>
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div style={styles.brand}>
      <span style={styles.logo}>S</span>
      <span style={styles.brandName}>SaaSBoard</span>
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
  subtitle: {
    margin: "0 0 20px",
    fontSize: 14,
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
    marginBottom: 12,
  },
  errorLink: { color: "var(--error-text)", fontWeight: 600 },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 },
  input: {
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    marginBottom: 16,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
  },
  hint: { margin: "-10px 0 16px", fontSize: 12, color: "var(--text-muted)" },
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
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "var(--text-muted)",
  },
  footerLink: { color: "var(--primary-text)", fontWeight: 600, textDecoration: "none" },
};
