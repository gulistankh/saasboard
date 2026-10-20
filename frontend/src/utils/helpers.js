// Format a date like "Oct 16, 2026"
export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format a date with time like "Oct 16, 2026, 3:45 PM"
export const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return "";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Format a number with separators: 12500 -> "12,500"
export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

// Compact format for big numbers: 12500 -> "12.5K"
export const formatCompact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

// Get initials for an avatar: "John Smith" -> "JS"
export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

// Capitalize the first letter: "admin" -> "Admin"
export const capitalize = (text = "") =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Basic email check
export const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Password rules: at least 8 characters, with a letter and a number.
// Returns an error message, or "" if the password is fine.
export const getPasswordError = (password = "") => {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Password must include a letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  return "";
};

// Join CSS class names, skipping empty values: cx("btn", isActive && "active")
export const cx = (...classes) => classes.filter(Boolean).join(" ");
