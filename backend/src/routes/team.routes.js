import { Router } from "express";
import * as team from "../controllers/team.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { blockDemo } from "../middleware/demo.middleware.js";
import {
  acceptInviteSchema,
  idParamSchema,
  sendInviteSchema,
  tokenParamSchema,
  updateRoleSchema,
} from "../validators/team.validator.js";

const router = Router();

// Public: must come BEFORE the authenticated routes and the /:id routes
router.get(
  "/invites/details/:token",
  validate(tokenParamSchema, "params"),
  team.getInviteDetails
);

router.use(authenticate);

// Members
router.get("/members", team.getMembers);
router.patch(
  "/members/:id/role",
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateRoleSchema),
  team.updateMemberRole
);
router.delete(
  "/members/:id",
  requireAdmin,
  validate(idParamSchema, "params"),
  team.removeMember
);

// Invites
router.get("/invites", requireAdmin, team.getInvites);
router.post("/invites", requireAdmin, blockDemo, validate(sendInviteSchema), team.sendInvite);
router.post("/invites/accept", validate(acceptInviteSchema), team.acceptInvite);
router.post(
  "/invites/:id/resend",
  requireAdmin,
  blockDemo,
  validate(idParamSchema, "params"),
  team.resendInvite
);
router.delete(
  "/invites/:id",
  requireAdmin,
  validate(idParamSchema, "params"),
  team.revokeInvite
);

export default router;
