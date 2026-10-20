import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../services/api";
import { resendVerification, verifyEmail } from "../../services/authService";
import { isValidEmail } from "../../utils/helpers";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // status: "loading" | "success" | "error"
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "" : "This verification link is missing or incomplete."
  );

  const [email, setEmail] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendInfo, setResendInfo] = useState("");
  const [resending, setResending] = useState(false);

  // React StrictMode runs effects twice in development. The token is
  // single-use, so this ref makes sure we only call the backend once.
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    const run = async () => {
      try {
        const data = await verifyEmail(token);
        setMessage(data?.message || "Your email has been verified.");
        setStatus("success");
      } catch (err) {
        setMessage(getErrorMessage(err));
        setStatus("error");
      }
    };

    run();
  }, [token]);

  const handleResend = async (event) => {
    event.preventDefault();
    setResendError("");
    setResendInfo("");

    if (!isValidEmail(email)) {
      setResendError("Please enter a valid email address.");
      return;
    }

    setResending(true);
    try {
      await resendVerification(email.trim());
      setResendInfo("A new verification email was sent. Please check your inbox.");
    } catch (err) {
      setResendError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span>
          <span style={styles.brandName}>SaaSBoard</span>
        </div>

        {status === "loading" && (
          <>
            <h1 style={styles.title}>Verifying your email...</h1>
            <p style={styles.subtitle}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 style={styles.title}>Email verified</h1>
            <p style={styles.subtitle}>
              {message} You can now log in to your account.
            </p>
            <Link to="/login" style={styles.buttonLink}>
              Go to log in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 style={styles.title}>Verification failed</h1>
            <div role="alert" style={styles.error}>
              {message}
            </div>
            <p style={styles.subtitle}>
              Enter your email and we'll send you a new verification link.
            </p>

            {resendError && (
              <div role="alert" style={styles.error}>
                {resendError}
              </div>
            )}
            {resendInfo && <div style={styles.success}>{resendInfo}</div>}

            <form onSubmit={handleResend} noValidate style={styles.form}>
              <label style={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                style={styles.input}
              />
              <button
                type="submit"
                disabled={resending}
                style={{
                  ...styles.button,
                  ...(resending ? styles.buttonDisabled : {}),
                }}
              >
                {resending ? "Sending..." : "Send new link"}
              </button>
            </form>

            <p style={styles.footer}>
              <Link to="/login" style={styles.footerLink}>
                Back to log in
              </Link>
            </p>
          </>
        )}
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
  title: { margin: "0 0 8px", fontSize: 24, color: "var(--text)" },
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
  success: {
    background: "var(--success-bg)",
    border: "1px solid var(--success-border)",
    color: "var(--success-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
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