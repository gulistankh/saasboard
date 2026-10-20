import rateLimit from "express-rate-limit";
import env from "../config/env.js";

// Strict limits in production, relaxed ones while developing
const dev = !env.isProduction;

const make = (windowMinutes, max, message, options = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    ...options,
  });

// Login, signup, reset: only FAILED attempts count against the limit
export const authLimiter = make(
  15,
  dev ? 200 : 20,
  "Too many attempts. Please try again in a few minutes.",
  { skipSuccessfulRequests: true }
);

// Emails (verification, reset): stops email spam
export const emailLimiter = make(
  60,
  dev ? 50 : 5,
  "Too many requests. Please try again later."
);

// Everything else under /api
export const apiLimiter = make(
  15,
  dev ? 2000 : 500,
  "Too many requests. Please slow down."
);

// Demo workspaces: each one creates data, so limit them per IP
export const demoLimiter = make(
  60,
  dev ? 100 : 20,
  "Too many demo sessions from your network. Please try again later."
);