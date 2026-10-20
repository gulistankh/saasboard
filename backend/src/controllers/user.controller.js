import * as User from "../models/user.model.js";
import {
  getRefreshCookie,
  revokeAllUserTokens,
} from "../services/token.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { AVATAR_DIR } from "../middleware/upload.middleware.js";

// ---- PATCH /users/me ----
// Only the name can change. The validator already stripped every other field.
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.updateName(req.user.id, req.body.name);
  res.json({ user });
});

// ---- PATCH /users/me/password ----
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const currentHash = await User.findPasswordHashById(req.user.id);
  if (!currentHash) {
    throw AppError.unauthorized("Account no longer exists");
  }

  const valid = await comparePassword(currentPassword, currentHash);
  if (!valid) {
    // 400 on purpose (not 401): a 401 would make api.js try a token refresh
    throw AppError.badRequest("Current password is incorrect.");
  }

  const sameAsOld = await comparePassword(newPassword, currentHash);
  if (sameAsOld) {
    throw AppError.badRequest(
      "The new password must be different from the current one."
    );
  }

  await User.updatePassword(req.user.id, await hashPassword(newPassword));

  // Log out every OTHER device, but keep this one signed in
  await revokeAllUserTokens(req.user.id, getRefreshCookie(req));

  res.json({ message: "Password changed successfully." });
});

// ---- GET /users/me/settings ----
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await User.getSettings(req.user.id);
  res.json({ settings });
});

// ---- PATCH /users/me/settings ----
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await User.saveSettings(req.user.id, req.body);
  res.json({ settings });
});

// Delete an old picture from disk (ignore it if it's already gone)
const removeAvatarFile = (file) =>
  fs.unlink(path.join(AVATAR_DIR, path.basename(file))).catch(() => {});

// ---- POST /users/me/avatar ----
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest("Please choose an image.");

  const filename = `${crypto.randomUUID()}.webp`;

  try {
    // sharp only accepts real images. It also strips metadata (GPS, camera info).
    await sharp(req.file.buffer)
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(path.join(AVATAR_DIR, filename));
  } catch {
    throw AppError.badRequest("This file is not a valid image.");
  }

  const oldFile = await User.getAvatarFile(req.user.id);
  await User.setAvatarFile(req.user.id, filename);
  if (oldFile) await removeAvatarFile(oldFile);

  res.json({ user: await User.findById(req.user.id) });
});

// ---- DELETE /users/me/avatar ----
export const deleteAvatar = asyncHandler(async (req, res) => {
  const oldFile = await User.getAvatarFile(req.user.id);
  await User.setAvatarFile(req.user.id, null);
  if (oldFile) await removeAvatarFile(oldFile);

  res.json({ user: await User.findById(req.user.id) });
});