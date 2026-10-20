import argon2 from "argon2";
import crypto from "crypto";

// ---- Passwords (Argon2id, OWASP-recommended settings) ----

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export const hashPassword = (password) => argon2.hash(password, ARGON_OPTIONS);

export const comparePassword = async (password, passwordHash) => {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false; // malformed hash: treat as a failed login
  }
};

// A real hash of a random string, computed once at startup.
// Used at login when the email doesn't exist, so the response takes
// about the same time either way (prevents guessing which emails exist).
const DUMMY_HASH = await argon2.hash(
  crypto.randomBytes(16).toString("hex"),
  ARGON_OPTIONS
);

export const fakePasswordCheck = (password) =>
  comparePassword(password, DUMMY_HASH);

// ---- One-time tokens ----

// SHA-256 hash of a token. This is what we store in the database.
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Create a random token.
// Returns { token, tokenHash }:
//   token     -> goes in the email link or cookie (never stored)
//   tokenHash -> stored in the database
export const generateToken = (bytes = 32) => {
  const token = crypto.randomBytes(bytes).toString("hex");
  return { token, tokenHash: hashToken(token) };
};

// Expiry date helpers: addHours(1), addDays(7)
export const addHours = (hours) =>
  new Date(Date.now() + hours * 60 * 60 * 1000);

export const addDays = (days) => addHours(days * 24);
