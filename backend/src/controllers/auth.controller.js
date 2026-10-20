import env from "../config/env.js";
import crypto from "crypto";
import * as Demo from "../models/demo.model.js";
import { withTransaction } from "../config/db.js";
import * as User from "../models/user.model.js";
import * as Workspace from "../models/workspace.model.js";
import * as Invite from "../models/invite.model.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/email.service.js";
import {
  clearRefreshCookie,
  consumeRefreshToken,
  createRefreshToken,
  getRefreshCookie,
  revokeAllUserTokens,
  revokeRefreshToken,
  setRefreshCookie,
  signAccessToken,
} from "../services/token.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  addHours,
  comparePassword,
  fakePasswordCheck,
  generateToken,
  hashPassword,
  hashToken,
} from "../utils/hash.js";

// Emails are sent in the background (not awaited). This keeps response times
// the same whether or not an account exists, and a mail failure never breaks
// the request. The user can always use "Resend".
const sendInBackground = (promise, label) => {
  promise.catch((err) => console.error(`Failed to send ${label} email:`, err.message));
};

// Remove password_hash before sending a user to the browser
const publicUser = (user) => {
  const { passwordHash, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
};

// Start a new session: refresh cookie + access token
const startSession = async (req, res, userId) => {
  const refreshToken = await createRefreshToken(userId, req.get("user-agent"));
  setRefreshCookie(res, refreshToken);
  return signAccessToken(userId);
};

// ---- POST /auth/signup ----
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, inviteToken } = req.body;

  if (await User.emailExists(email)) {
    throw AppError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  // Signing up from an invite link: join that workspace with the invited role
  if (inviteToken) {
    await withTransaction(async (client) => {
      const invite = await Invite.consumeByTokenHash(hashToken(inviteToken), client);
      if (!invite) {
        throw AppError.badRequest("This invitation is invalid or has expired.");
      }
      if (invite.email !== email) {
        throw AppError.forbidden("This invitation was sent to a different email address.");
      }
      await User.createUser(
        {
          name,
          email,
          passwordHash,
          role: invite.role,
          workspaceId: invite.workspaceId,
          emailVerified: true, // the invite email already proved ownership
        },
        client
      );
    });

    return res.status(201).json({
      message: "Account created. You joined the workspace. You can log in now.",
      joinedWorkspace: true,
    });
  }

  // Normal signup: new workspace, user is its admin and owner
  const { token, tokenHash } = generateToken();

  await withTransaction(async (client) => {
    const workspaceId = await Workspace.createWorkspace(
      `${name.slice(0, 40)}'s Workspace`,
      null,
      client
    );
    const userId = await User.createUser(
      { name, email, passwordHash, role: "admin", workspaceId, emailVerified: false },
      client
    );
    await Workspace.setOwner(workspaceId, userId, client);
    await User.createEmailVerificationToken(
      userId,
      tokenHash,
      addHours(env.tokens.verifyEmailHours),
      client
    );
  });

  sendInBackground(sendVerificationEmail({ to: email, name, token }), "verification");

  res.status(201).json({
    message: "Account created. Please check your email to verify your address.",
  });
});

// ---- POST /auth/login ----
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmailWithPassword(email);

  if (!user) {
    // Same work as a real check, so timing doesn't reveal missing accounts
    await fakePasswordCheck(password);
    throw AppError.unauthorized("Invalid email or password");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized("Invalid email or password");
  }

  // Checked only AFTER the password is correct, so this message can't be
  // used by strangers to discover which emails are registered
  if (!user.emailVerified) {
    throw AppError.forbidden("Please verify your email first");
  }

  const accessToken = await startSession(req, res, user.id);
  res.json({ accessToken, user: publicUser(user) });
});

// ---- POST /auth/logout ----
export const logout = asyncHandler(async (req, res) => {
  await revokeRefreshToken(getRefreshCookie(req));
  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
});

// ---- POST /auth/refresh ----
// Rotation: the old refresh token is deleted and a new one is issued
export const refresh = asyncHandler(async (req, res) => {
  const userId = await consumeRefreshToken(getRefreshCookie(req));

  if (!userId) {
    clearRefreshCookie(res);
    throw AppError.unauthorized("Session expired. Please log in again.");
  }

  const user = await User.findById(userId);
  if (!user || !user.emailVerified) {
    clearRefreshCookie(res);
    throw AppError.unauthorized("Session expired. Please log in again.");
  }

  const accessToken = await startSession(req, res, user.id);
  res.json({ accessToken });
});

// ---- GET /auth/me ----
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// ---- POST /auth/verify-email ----
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  await withTransaction(async (client) => {
    const userId = await User.consumeEmailVerificationToken(hashToken(token), client);
    if (!userId) {
      throw AppError.badRequest("This verification link is invalid or has expired.");
    }
    await User.markEmailVerified(userId, client);
  });

  res.json({ message: "Your email has been verified." });
});

// ---- POST /auth/resend-verification ----
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmailWithPassword(email);

  if (user && !user.emailVerified) {
    const { token, tokenHash } = generateToken();
    await User.createEmailVerificationToken(
      user.id,
      tokenHash,
      addHours(env.tokens.verifyEmailHours)
    );
    sendInBackground(
      sendVerificationEmail({ to: user.email, name: user.name, token }),
      "verification"
    );
  }

  // Same answer whether or not the account exists
  res.json({
    message: "If this account needs verification, a new email has been sent.",
  });
});

// ---- POST /auth/forgot-password ----
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmailWithPassword(email);

  if (user) {
    const { token, tokenHash } = generateToken();
    await User.createPasswordResetToken(
      user.id,
      tokenHash,
      addHours(env.tokens.resetPasswordHours)
    );
    sendInBackground(
      sendPasswordResetEmail({ to: user.email, name: user.name, token }),
      "password reset"
    );
  }

  res.json({
    message: "If an account exists for this email, a reset link has been sent.",
  });
});

// ---- POST /auth/reset-password ----
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const passwordHash = await hashPassword(password);

  const userId = await withTransaction(async (client) => {
    const id = await User.consumePasswordResetToken(hashToken(token), client);
    if (!id) {
      throw AppError.badRequest("This reset link is invalid or has expired.");
    }
    await User.updatePassword(id, passwordHash, client);
    return id;
  });

  // Log the user out of every device (a stolen session stops working)
  await revokeAllUserTokens(userId);
  clearRefreshCookie(res);

  res.json({ message: "Your password has been updated." });
});

// ---- POST /auth/demo ----
const MAX_DEMO_WORKSPACES = 200; // protects a small free database

// Nobody knows this password, so demo accounts can't be logged into normally
let demoPasswordHash;
const getDemoPasswordHash = () => {
  demoPasswordHash ??= hashPassword(crypto.randomBytes(32).toString("hex"));
  return demoPasswordHash;
};

export const startDemo = asyncHandler(async (req, res) => {
  await Demo.deleteExpiredDemos().catch(() => {});
  if ((await Demo.countDemoWorkspaces()) >= MAX_DEMO_WORKSPACES) {
    await Demo.deleteExpiredDemos();
    if ((await Demo.countDemoWorkspaces()) >= MAX_DEMO_WORKSPACES) {
      throw new AppError("The demo is busy right now. Please try again in a few minutes.", 503);
    }
  }

  const userId = await Demo.createDemoWorkspace(await getDemoPasswordHash());
  const accessToken = await startSession(req, res, userId);
  const user = await User.findById(userId);

  res.status(201).json({ accessToken, user });
});