import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// Page titles shown in the Navbar, based on the current URL
const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/team": "Team",
  "/workspace": "Workspace",
  "/profile": "Profile",
  "/settings": "Settings",
};

// Used as a layout route in AppRoutes.jsx:
// <Route element={<DashboardLayout />}> ...private pages... </Route>
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  const title = PAGE_TITLES[pathname] || "";

  // Close the mobile drawer whenever the page changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div style={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main">
        {user?.isDemo && (
          <div style={styles.demoBanner} role="status">
            <Info size={16} aria-hidden="true" style={styles.demoIcon} />
            <span>
              <strong style={styles.demoTitle}>Demo workspace.</strong> Sample
              data is deleted after 24 hours. Invites, password and picture
              changes are disabled.
            </span>
          </div>
        )}

        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Desktop: leave room for the fixed sidebar. Mobile: full width. */}
      <style>{`
        .dashboard-main {
          margin-left: 240px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: "var(--bg)",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  demoBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "10px 24px",
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--primary-text)",
    background: "var(--primary-soft)",
    borderBottom: "1px solid var(--primary-border)",
  },
  demoIcon: { flexShrink: 0 },
  demoTitle: { fontWeight: 700 },
};