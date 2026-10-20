import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  Building2,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";

// Each link can be limited to certain roles. No "roles" key = everyone.
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/team", label: "Team", icon: Users },
  { to: "/workspace", label: "Workspace", icon: Building2, roles: ["admin"] },
  { to: "/profile", label: "Profile", icon: UserCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

// Usage: <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Dark overlay behind the drawer on mobile */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span>
          <span style={styles.brandName}>SaaSBoard</span>
        </div>

        <nav style={styles.nav} aria-label="Main navigation">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : {}),
              })}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Responsive behavior: fixed on desktop, slide-in drawer on mobile */}
      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 240px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 40;
          transition: transform 0.2s ease;
        }
        .sidebar-overlay {
          display: none;
        }
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.sidebar-open {
            transform: translateX(0);
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
          }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 30;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  brand: {
    height: 64,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 20px",
    borderBottom: "1px solid var(--border)",
  },
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
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 12,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-2)",
    textDecoration: "none",
  },
  linkActive: {
    background: "var(--primary-soft)",
    color: "var(--primary-text)",
  },
};
