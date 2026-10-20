import { z } from "zod";

// ---- Reusable pieces ----

const email = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .max(254, "Email is too long");

// Same rules as getPasswordError() in the frontend helpers.js.
// Max 128 characters stops huge inputs from slowing down the hashing.
const password = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/\d/, "Password must include a number.");

const name = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Please enter your full name.")
  .max(80, "Name must be 80 characters or fewer.");

// Tokens from email links are 64 hex characters (32 random bytes)
const token = z
  .string({ required_error: "Token is required" })
  .trim()
  .min(10, "Invalid token")
  .max(200, "Invalid token");

// ---- Schemas ----

export const signupSchema = z.object({
  name,
  email,
  password,
  inviteToken: token.optional(),
});

// Login does NOT apply the password rules: we only check it isn't empty,
// so people with older passwords can still log in.
export const loginSchema = z.object({
  email,
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .max(128, "Invalid email or password"),
});

export const verifyEmailSchema = z.object({ token });

export const resendVerificationSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ token, password });

// PATCH /users/me: only the name can change
export const updateProfileSchema = z.object({ name });

// PATCH /users/me/password
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required" })
    .min(1, "Current password is required")
    .max(128, "Current password is incorrect."),
  newPassword: password,
});

// PATCH /users/me/settings: only these three booleans are accepted
export const updateSettingsSchema = z.object({
  emailProductUpdates: z.boolean().optional(),
  emailTeamActivity: z.boolean().optional(),
  emailSecurityAlerts: z.boolean().optional(),
});
