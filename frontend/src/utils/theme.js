const KEY = "theme"; // "light" | "dark" | "system"

export const getStoredTheme = () => {
  try {
    return localStorage.getItem(KEY) || "dark";
  } catch {
    return "dark";
  }
};

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)");

export const applyTheme = (theme) => {
  const resolved =
    theme === "system" ? (prefersDark().matches ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
};

// Save the choice and apply it immediately
export const setTheme = (theme) => {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the choice just won't persist
  }
  applyTheme(theme);
};

// Called once at startup. Also follows the OS when the choice is "system".
export const initTheme = () => {
  applyTheme(getStoredTheme());
  prefersDark().addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
};