import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { query } from "../config/db.js";
import { addDays, generateToken, hashToken } from "../utils/hash.js";
import AppError from "../utils/AppError.js";

const REFRESH_COOKIE = "refreshToken";

// ---- Access tokens (JWT) ----

// The payload holds only the user id. Role and workspace are loaded from the
// database on every request, so a demoted admin loses access immediately.
export const signAccessToken = (userId) =>
  jwt.sign({}, env.jwt.accessSecret, {
    subject: String(userId),
    expiresIn: env.jwt.accessExpiresIn,
    algorithm: "HS256",
  });

// Returns the user id, or throws a 401 AppError
export const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      algorithms: ["HS256"],
    });
    return payload.sub;
  } catch {
    throw AppError.unauthorized("Invalid or expired access token");
  }
};

// ---- Refresh tokens (stored hashed in the refresh_tokens table) ----

// Create a new session. Returns the raw token to put in the cookie.
export const createRefreshToken = async (userId, userAgent = null) => {
  const { token, tokenHash } = generateToken();
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [
      userId,
      tokenHash,
      addDays(env.jwt.refreshExpiresDays),
      userAgent ? userAgent.slice(0, 255) : null,
    ]
  );
  return token;
};

// Use a refresh token once: delete it and return its user id.
// A single DELETE ... RETURNING is atomic, so two requests can't both
// use the same token. Returns null if the token is unknown or expired.
export const consumeRefreshToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") return null;
  const { rows } = await query(
    `DELETE FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING user_id`,
    [hashToken(rawToken)]
  );
  return rows[0]?.user_id ?? null;
};

// Log out one device
export const revokeRefreshToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") return;
  await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
    hashToken(rawToken),
  ]);
};

// Log out everywhere (password reset, password change, removed from workspace).
// Pass exceptRawToken to keep the current device logged in.
export const revokeAllUserTokens = async (userId, exceptRawToken = null) => {
  if (exceptRawToken) {
    await query(
      "DELETE FROM refresh_tokens WHERE user_id = $1 AND token_hash <> $2",
      [userId, hashToken(exceptRawToken)]
    );
  } else {
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
  }
};

// Housekeeping: remove expired rows (called from server.js on a timer)
export const deleteExpiredRefreshTokens = async () => {
  await query("DELETE FROM refresh_tokens WHERE expires_at < NOW()");
};

// ---- Refresh cookie ----

// "path" limits the cookie to /api/auth, so it is not sent with every
// API request. clearCookie must use the same path to work.
const cookieOptions = () => ({
  httpOnly: true, // JavaScript can't read it (protects against XSS)
  secure: env.isProduction, // HTTPS only in production
  sameSite: "lax",
  path: "/api/auth",
});

export const setRefreshCookie = (res, rawToken) => {
  res.cookie(REFRESH_COOKIE, rawToken, {
    ...cookieOptions(),
    maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
};

export const getRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE];