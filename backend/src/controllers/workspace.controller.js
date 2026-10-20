import { withTransaction } from "../config/db.js";
import * as Workspace from "../models/workspace.model.js";
import { clearRefreshCookie } from "../services/token.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

// ---- GET /workspace (admin) ----
export const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.user.workspaceId);
  if (!workspace) throw AppError.notFound("Workspace not found");
  res.json({ workspace });
});

// ---- PATCH /workspace (admin) ----
export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.rename(req.user.workspaceId, req.body.name);
  if (!workspace) throw AppError.notFound("Workspace not found");
  res.json({ workspace });
});

// ---- DELETE /workspace (owner only) ----
export const deleteWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.user;

  await withTransaction(async (client) => {
    const workspace = await Workspace.findById(workspaceId, client);
    if (!workspace) throw AppError.notFound("Workspace not found");

    // Being an admin isn't enough: only the owner can delete everything
    if (workspace.ownerId !== req.user.id) {
      throw AppError.forbidden("Only the workspace owner can delete it.");
    }

    // Removes the users, then the workspace. Projects, tasks, invites and
    // activity are removed by ON DELETE CASCADE, and so are the users'
    // refresh tokens, so every session in this workspace ends.
    await Workspace.deleteWorkspace(workspaceId, client);
  });

  clearRefreshCookie(res);
  res.json({ message: "Workspace deleted." });
});
