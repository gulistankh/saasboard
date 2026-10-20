import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import ResetPassword from "../pages/auth/ResetPassword";
import Signup from "../pages/auth/Signup";
import VerifyEmail from "../pages/auth/VerifyEmail";
import Dashboard from "../pages/dashboard/Dashboard";
import NotFound from "../pages/NotFound";
import Profile from "../pages/settings/Profile";
import Settings from "../pages/settings/Settings";
import AcceptInvite from "../pages/team/AcceptInvite";
import Team from "../pages/team/Team";
import Workspace from "../pages/workspace/Workspace";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* Private routes: must be logged in */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Visible to everyone: Team shows a read-only view for members */}
          <Route path="/team" element={<Team />} />

          {/* Admin-only routes */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/workspace" element={<Workspace />} />
          </Route>
        </Route>
      </Route>

      {/* Default and fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
