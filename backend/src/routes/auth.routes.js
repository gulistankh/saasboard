import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authLimiter, demoLimiter, emailLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), auth.signup);
router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.post("/logout", auth.logout);
router.post("/refresh", auth.refresh);
router.get("/me", authenticate, auth.me);

router.post("/verify-email", authLimiter, validate(verifyEmailSchema), auth.verifyEmail);
router.post(
  "/resend-verification",
  emailLimiter,
  validate(resendVerificationSchema),
  auth.resendVerification
);
router.post(
  "/forgot-password",
  emailLimiter,
  validate(forgotPasswordSchema),
  auth.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  auth.resetPassword
);
router.post("/demo", demoLimiter, auth.startDemo);
export default router;
