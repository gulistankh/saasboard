import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// The access token lives in memory only (not localStorage), so it can't be
// stolen by an XSS attack. The refresh token will be an httpOnly cookie
// set by the backend.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Endpoints where a 401 means "wrong credentials", not "expired token"
const NO_REFRESH_URLS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Shared promise so several failed requests trigger only ONE refresh call
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// On 401, try to refresh the token once, then retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const skip = NO_REFRESH_URLS.some((url) => original?.url?.includes(url));

    if (status === 401 && original && !original._retry && !skip) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        // AuthContext will listen to this event and log the user out
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper to get a readable error message from any failed request
export const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

export default api;
