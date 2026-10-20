import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  const target = isAuthenticated ? "/dashboard" : "/login";
  const label = isAuthenticated ? "Back to dashboard" : "Go to log in";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.code}>404</div>
        <h1 style={styles.title}>Page not found</h1>
        <p style={styles.subtitle}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link to={target} style={styles.buttonLink}>
          {label}
        </Link>
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
    textAlign: "center",
  },
  code: {
    fontSize: 56,
    fontWeight: 800,
    color: "var(--primary-text)",
    lineHeight: 1,
    marginBottom: 12,
  },
  title: { margin: "0 0 8px", fontSize: 24, color: "var(--text)" },
  subtitle: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  buttonLink: {
    display: "block",
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 600,
    color: "#ffffff",
    background: "#4f46e5",
    borderRadius: 8,
    textDecoration: "none",
  },
};