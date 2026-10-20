import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we check whether a valid session already exists
  const [loading, setLoading] = useState(true);

  // On first load, try to restore the session from the refresh cookie
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const currentUser = await authService.restoreSession();
        if (active) setUser(currentUser);
      } catch {
        if (active) setUser(null); // no valid session, user is logged out
      } finally {
        if (active) setLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, []);

  // api.js fires this event when the refresh token fails
  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);
    const startDemo = useCallback(async () => {
    const demoUser = await authService.startDemo();
    setUser(demoUser);
    return demoUser;
  }, []);

  const signup = useCallback((data) => authService.signup(data), []);

  const logout = useCallback(async () => {
    try {lue
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Lets pages (like Profile) update the user after editing their data
  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
      updateUser,
      startDemo
    }),
    [user, loading, login, signup, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}