import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { capitalize} from "../../utils/helpers";
import { ChevronDown, LogOut, Menu, Settings, UserCircle } from "lucide-react";
import Avatar from "../ui/Avatar";

// Usage: <Navbar title="Dashboard" onMenuClick={() => setSidebarOpen(true)} />
export default function Navbar({ title = "", onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the dropdown with the Escape key
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
          {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="navbar-menu-button"
            style={styles.menuButton}
          >
            <Menu size={22} />
          </button>
        )}

        <h1 style={styles.title}>{title}</h1>
      </div>

      <div style={styles.menuWrapper} ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
          style={styles.userButton}
        >
          <Avatar name={user?.name} src={user?.avatarUrl} size={36} />
          <span style={styles.userInfo}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.userRole}>{capitalize(user?.role)}</span>
          </span>
          <ChevronDown size={16} style={styles.caret} />
        </button>

        {open && (
          <div role="menu" style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={styles.item}
            >
              <UserCircle size={16} aria-hidden="true" />
              Profile
            </Link>
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={styles.item}
            >
              <Settings size={16} aria-hidden="true" />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              style={{ ...styles.item, ...styles.logout }}
            >
              <LogOut size={16} aria-hidden="true" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  left: { display: "flex", alignItems: "center", gap: 12 },
  menuButton: {
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    color: "var(--text-2)",
  },
  title: { margin: 0, fontSize: 20, color: "var(--text)" },
  menuWrapper: { position: "relative" },
  userButton: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    borderRadius: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
  },
  userInfo: { display: "flex", flexDirection: "column", textAlign: "left" },
  userName: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  userRole: { fontSize: 12, color: "var(--text-muted)" },
  userEmail: { fontSize: 12, color: "var(--text-muted)" },
  caret: { fontSize: 12, color: "var(--text-muted)" },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    minWidth: 220,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  dropdownHeader: { padding: "12px 16px", borderBottom: "1px solid var(--surface-2)" },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 16px",
    textAlign: "left",
    fontSize: 14,
    color: "var(--text-2)",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  logout: { color: "var(--danger)", borderTop: "1px solid var(--surface-2)" },
};