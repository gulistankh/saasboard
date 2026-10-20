import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useAuth from "../../hooks/useAuth";
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

  const title = PAGE_TITLES[pathname] || "";
  const { user } = useAuth();

  // Close the mobile drawer whenever the page changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div style={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main">
          {user?.isDemo && (
          <div style={styles.demoBanner}>
            You're exploring a demo workspace. Sample data is deleted after 24
            hours, and email, password and picture changes are disabled.
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
        demoBanner: {
        padding: "8px 24px",
        fontSize: 13,
        textAlign: "center",
        color: "var(--primary-text)",
        background: "var(--primary-soft)",
        borderBottom: "1px solid var(--primary-border)",
        },
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
};