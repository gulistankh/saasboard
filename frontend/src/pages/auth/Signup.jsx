 import { Lock, Mail, User } from "lucide-react";
          import IconInput from "../../components/ui/IconInput";
import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import { resendVerification } from "../../services/authService";
import { getInviteDetails } from "../../services/teamService";
import { getPasswordError, isValidEmail } from "../../utils/helpers";

export default function Signup() {
  const { signup, isAuthenticated, loading } = useAuth();

  const [form, setForm] = useState({ 
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [invite, setInvite] = useState(null);
  const [joined, setJoined] = useState(false);

  // Coming from an invite link: load it and lock the email to the invited one
  useEffect(() => {
    if (!inviteToken) return;
    let active = true;
    getInviteDetails(inviteToken)
      .then((data) => {
        if (!active) return;
        setInvite(data);
        setForm((prev) => ({ ...prev, email: data.email }));
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [inviteToken]);

  // Already logged in: don't show the signup form
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
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
      const result = await signup({
        name,
        email,
        password: form.password,
        inviteToken: inviteToken || undefined,
      });
      setJoined(Boolean(result?.joinedWorkspace));
      setRegisteredEmail(email);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
    };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      await resendVerification(registeredEmail);
      setInfo("Verification email sent again. Please check your inbox.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
   
    if (registeredEmail && joined) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.brand}>
            <span style={styles.logo}>S</span>
            <span style={styles.brandName}>SaaSBoard</span>
          </div>
          <h1 style={styles.title}>Welcome to the team</h1>
          <p style={styles.subtitle}>
            Your account is ready and you joined <strong>{invite?.workspaceName}</strong>.
            Log in to continue.
          </p>
          <Link to="/login" style={styles.footerLink}>
            Go to log in
          </Link>
        </div>
      </div>
    );
  }


  // Success screen: ask the user to verify their email
  if (registeredEmail) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.brand}>
            <span style={styles.logo}>S</span>
            <span style={styles.brandName}>SaaSBoard</span>
          </div>

          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.subtitle}>
            We sent a verification link to <strong>{registeredEmail}</strong>.
            Click it to activate your account, then log in.
          </p>

          {error && (
            <div role="alert" style={styles.error}>
              {error}
            </div>
          )}
          {info && <div style={styles.success}>{info}</div>}

          <button type="button" onClick={handleResend} style={styles.linkButton}>
            Didn't get it? Resend the email
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

        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Start managing your team in minutes.</p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <label style={styles.label} htmlFor="name">
            Full name
          </label>
  <IconInput
            id="name"
            name="name"
            type="text"
            icon={User}
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Smith"
          />

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
            readOnly={Boolean(invite)}
          />
          <label style={styles.label} htmlFor="password">
            Password
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
            Confirm password
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
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
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
  subtitle: { margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 },
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
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "var(--text-muted)",
  },
  footerLink: { color: "var(--primary-text)", fontWeight: 600, textDecoration: "none" },
};
