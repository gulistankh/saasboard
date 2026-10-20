import api, { setAccessToken } from "./api";

// Create a new account. The backend sends a verification email.
export const signup = async ({ name, email, password, inviteToken }) => {
  const { data } = await api.post("/auth/signup", {
    name,
    email,
    password,
    inviteToken,
  });
  return data;
};

// Log in. Backend returns { accessToken, user } and sets the refresh cookie.
export const login = async ({ email, password }) => {
  const { data } = await api.post("/auth/login", { email, password });
  setAccessToken(data.accessToken);
  return data.user;
};

// Log out. Backend clears the refresh cookie.
export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
};

let restorePromise = null;

// Called when the app loads: uses the refresh cookie to restore the session.
// Concurrent calls share one request (the refresh token is single-use).
export const restoreSession = () => {
  if (!restorePromise) {
    restorePromise = (async () => {
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.accessToken);
      return getCurrentUser();
    })().finally(() => {
      restorePromise = null;
    });
  }
  return restorePromise;
};

// Get the currently logged-in user (id, name, email, role, workspace...)
export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data.user;
};

// Confirm the email using the token from the verification link
export const verifyEmail = async (token) => {
  const { data } = await api.post("/auth/verify-email", { token });
  return data;
};

// Ask for another verification email
export const resendVerification = async (email) => {
  const { data } = await api.post("/auth/resend-verification", { email });
  return data;
};

// Request a password reset email
export const forgotPassword = async (email) => {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
};

// Set a new password using the token from the reset link
export const resetPassword = async ({ token, password }) => {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
};

// Creates a temporary demo workspace and logs in to it
export const startDemo = async () => {
  const { data } = await api.post("/auth/demo");
  setAccessToken(data.accessToken);
  return data.user;
};