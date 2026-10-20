import env from "../config/env.js";
import { withTransaction } from "../config/db.js";
import * as Invite from "../models/invite.model.js";
import * as User from "../models/user.model.js";
import * as Workspace from "../models/workspace.model.js";
import { sendInviteEmail } from "../services/email.service.js";
import { revokeAllUserTokens } from "../services/token.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { addDays, generateToken, hashToken } from "../utils/hash.js";

const sendInBackground = (promise, label) => {
  promise.catch((err) => console.error(`Failed to send ${label} email:`, err.message));
};

// ---- GET /team/members (any logged-in member) ----
export const getMembers = asyncHandler(async (req, res) => {
  const members = await Workspace.listMembers(req.user.workspaceId);
  res.json({ members });
});

// ---- PATCH /team/members/:id/role (admin) ----
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const { workspaceId } = req.user;

  if (id === req.user.id) {
    throw AppError.badRequest("You can't change your own role.");
  }

  const member = await withTransaction(async (client) => {
    // Lock the admins so two simultaneous requests can't remove them all
    await Workspace.lockAdmins(workspaceId, client);

    const target = await Workspace.findMember(workspaceId, id, client);
    if (!target) throw AppError.notFound("Member not found");

    if (target.role === role) return target;

    if (target.role === "admin" && role !== "admin") {
      const admins = await Workspace.countAdmins(workspaceId, client);
      if (admins <= 1) {
        throw AppError.badRequest("A workspace must keep at least one admin.");
      }
    }

    return Workspace.updateMemberRole(workspaceId, id, role, client);
  });

  res.json({ member });
});

// ---- DELETE /team/members/:id (admin) ----
export const removeMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { workspaceId } = req.user;

  if (id === req.user.id) {
    throw AppError.badRequest("You can't remove yourself from the workspace.");
  }

  await withTransaction(async (client) => {
    await Workspace.lockAdmins(workspaceId, client);

    const target = await Workspace.findMember(workspaceId, id, client);
    if (!target) throw AppError.notFound("Member not found");

    if (target.role === "admin") {
      const admins = await Workspace.countAdmins(workspaceId, client);
      if (admins <= 1) {
        throw AppError.badRequest("A workspace must keep at least one admin.");
      }
    }

    // The workspace owner can't be removed (deleting the workspace is the way out)
    const workspace = await Workspace.findById(workspaceId, client);
    if (workspace?.ownerId === id) {
      throw AppError.badRequest("The workspace owner can't be removed.");
    }

    await Workspace.removeMember(workspaceId, id, client);
  });

  // The removed account no longer exists, so its sessions are useless
  await revokeAllUserTokens(id);

  res.json({ message: "Member removed." });
});

// ---- GET /team/invites (admin) ----
export const getInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.listPending(req.user.workspaceId);
  res.json({ invites });
});

// ---- POST /team/invites (admin) ----
export const sendInvite = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { workspaceId } = req.user;

  if (await User.emailExists(email)) {
    throw AppError.conflict("A user with this email already has an account.");
  }
  if (await Invite.pendingExistsForEmail(workspaceId, email)) {
    throw AppError.conflict("This email has already been invited.");
  }

  const { token, tokenHash } = generateToken();
  const invite = await Invite.createInvite({
    workspaceId,
    email,
    role,
    tokenHash,
    invitedBy: req.user.id,
    expiresAt: addDays(env.tokens.inviteDays),
  });

  sendInBackground(
    sendInviteEmail({
      to: email,
      inviterName: req.user.name,
      workspaceName: req.user.workspaceName,
      role,
      token,
    }),
    "invite"
  );

  res.status(201).json({ invite });
});

// ---- DELETE /team/invites/:id (admin) ----
export const revokeInvite = asyncHandler(async (req, res) => {
  const removed = await Invite.revoke(req.user.workspaceId, req.params.id);
  if (!removed) throw AppError.notFound("Invitation not found");
  res.json({ message: "Invitation cancelled." });
});

// ---- POST /team/invites/:id/resend (admin) ----
export const resendInvite = asyncHandler(async (req, res) => {
  const { workspaceId } = req.user;
  const { token, tokenHash } = generateToken();

  const invite = await Invite.refreshToken(
    workspaceId,
    req.params.id,
    tokenHash,
    addDays(env.tokens.inviteDays)
  );
  if (!invite) throw AppError.notFound("Invitation not found");

  sendInBackground(
    sendInviteEmail({
      to: invite.email,
      inviterName: req.user.name,
      workspaceName: req.user.workspaceName,
      role: invite.role,
      token,
    }),
    "invite"
  );

  res.json({ message: "Invitation resent." });
});

// ---- GET /team/invites/details/:token (public) ----
export const getInviteDetails = asyncHandler(async (req, res) => {
  const invite = await Invite.findDetailsByTokenHash(hashToken(req.params.token));
  if (!invite) {
    throw AppError.notFound("This invitation is invalid or has expired.");
  }
  res.json({ invite });
});

// ---- POST /team/invites/accept (logged in) ----
export const acceptInvite = asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.body.token);

  await withTransaction(async (client) => {
    // Deleting the invite first makes it single-use; a rollback restores it
    const invite = await Invite.consumeByTokenHash(tokenHash, client);
    if (!invite) {
      throw AppError.badRequest("This invitation is invalid or has expired.");
    }

    if (invite.email !== req.user.email.toLowerCase()) {
      throw AppError.forbidden("This invitation was sent to a different email address.");
    }

    const oldWorkspaceId = req.user.workspaceId;

    if (oldWorkspaceId === invite.workspaceId) {
      throw AppError.conflict("You are already a member of this workspace.");
    }

    if (oldWorkspaceId) {
      const members = await Workspace.listMembers(oldWorkspaceId);
      const alone = members.length === 1;

      if (!alone && req.user.role === "admin") {
        throw AppError.badRequest(
          "You are an admin of a workspace that has other members. Transfer or remove them first."
        );
      }

      await User.setWorkspaceAndRole(req.user.id, invite.workspaceId, invite.role, client);

      // They were alone in their own workspace: it's empty now, so delete it
      if (alone) {
        await Workspace.deleteWorkspace(oldWorkspaceId, client);
      }
    } else {
      await User.setWorkspaceAndRole(req.user.id, invite.workspaceId, invite.role, client);
    }
  });

  res.json({ message: "You have joined the workspace." });
});
