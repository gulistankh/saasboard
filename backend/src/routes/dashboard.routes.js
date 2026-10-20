import { Router } from "express";
import * as dashboard from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  activityQuerySchema,
  recentQuerySchema,
} from "../validators/team.validator.js";

const router = Router();

router.use(authenticate);

router.get("/stats", dashboard.getStats);
router.get(
  "/activity",
  validate(activityQuerySchema, "query"),
  dashboard.getActivity
);
router.get("/tasks-by-status", dashboard.getTasksByStatus);
router.get("/recent", validate(recentQuerySchema, "query"), dashboard.getRecentActivity);
router.get("/projects", dashboard.getProjects);

export default router;