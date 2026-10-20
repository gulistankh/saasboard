import { z } from "zod";

// ---- Reusable pieces ----

const email = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .max(254, "Email is too long");

// Only these two roles exist. Must match the frontend and the database.
const role = z.enum(["admin", "member"], {
  errorMap: () => ({ message: "Role must be either admin or member" }),
});

const token = z
  .string({ required_error: "Token is required" })
  .trim()
  .min(10, "Invalid token")
  .max(200, "Invalid token");

// Our ids will be UUIDs (set up in Step 3). Checking the format here
// returns a clear 400 before the database is touched.
const uuid = z.string().uuid("Invalid identifier");

// ---- Body schemas ----

// POST /team/invites
export const sendInviteSchema = z.object({
  email,
  role: role.default("member"),
});

// PATCH /team/members/:id/role
export const updateRoleSchema = z.object({ role });

// POST /team/invites/accept
export const acceptInviteSchema = z.object({ token });

// PATCH /workspace
export const updateWorkspaceSchema = z.object({
  name: z
    .string({ required_error: "Workspace name is required" })
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(60, "Workspace name must be 60 characters or fewer."),
});

// ---- Params / query schemas ----
// Use with: validate(idParamSchema, "params")

export const idParamSchema = z.object({ id: uuid });

export const tokenParamSchema = z.object({ token });

// GET /dashboard/activity?range=30d
export const activityQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

// GET /dashboard/recent?limit=10
export const recentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
