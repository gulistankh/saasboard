import { Router } from "express";
import * as workspace from "../controllers/workspace.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateWorkspaceSchema } from "../validators/team.validator.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", workspace.getWorkspace);
router.patch("/", validate(updateWorkspaceSchema), workspace.updateWorkspace);
router.delete("/", workspace.deleteWorkspace);

export default router;
