import { Mail } from "lucide-react";
import IconInput from "../../components/ui/IconInput";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../../services/api";
import { forgotPassword } from "../../services/authService";
import { isValidEmail } from "../../utils/helpers";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(cleanEmail);
      setSentTo(cleanEmail);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen: same message whether or not the account exists
  if (sentTo) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.brand}>
            <span style={styles.logo}>S</span>
            <span style={styles.brandName}>SaaSBoard</span>
          </div>

          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.subtitle}>
            If an account exists for <strong>{sentTo}</strong>, we sent a link
            to reset your password. The link expires soon, so use it quickly.
          </p>

          <button
            type="button"
            onClick={() => setSentTo("")}
            style={styles.linkButton}
          >
            Use a different email
          </button>

          <p style={styles.footer}>
            <Link to="/login" style={styles.footerLink}>
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span>
          <span style={styles.brandName}>SaaSBoard</span>
        </div>

        <h1 style={styles.title}>Forgot your password?</h1>
        <p style={styles.subtitle}>
          Enter your email and we'll send you a link to reset it.
        </p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p style={styles.footer}>
          Remembered it?{" "}
          <Link to="/login" style={styles.footerLink}>
            Log in
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
  linkButton: {
    background: "none",
    border: "none",
    color: "var(--primary-text)",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
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
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "var(--text-muted)",
  },
  footerLink: { color: "var(--primary-text)", fontWeight: 600, textDecoration: "none" },
};