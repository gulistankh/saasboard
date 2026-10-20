import { Router } from "express";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import * as user from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { blockDemo } from "../middleware/demo.middleware.js";
import {
  changePasswordSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.use(authenticate);

router.patch("/me", validate(updateProfileSchema), user.updateProfile);
router.patch("/me/password", blockDemo, validate(changePasswordSchema), user.changePassword);
router.get("/me/settings", user.getSettings);
router.patch("/me/settings", validate(updateSettingsSchema), user.updateSettings);
router.post("/me/avatar", blockDemo, uploadAvatar, user.uploadAvatar);
router.delete("/me/avatar", user.deleteAvatar);

export default router;
