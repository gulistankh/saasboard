import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import AppError from "../utils/AppError.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// backend/uploads/avatars
export const AVATAR_DIR = path.resolve(here, "../../uploads/avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// The file stays in memory; the controller validates and re-encodes it with sharp
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(AppError.badRequest("Please upload a JPG, PNG or WebP image."));
    }
    cb(null, true);
  },
}).single("avatar");
