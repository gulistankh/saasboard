import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Usage: <Route element={<RoleRoute allowedRoles={["admin"]} />}> ... </Route>
export default function RoleRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  // Still checking the session: don't decide yet
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  // Not logged in at all: go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but the role isn't allowed: send back to the dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role is allowed: render the nested child routes
  return <Outlet />;
}
