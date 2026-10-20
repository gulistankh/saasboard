import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import teamRoutes from "./team.routes.js";
import userRoutes from "./user.routes.js";
import workspaceRoutes from "./workspace.routes.js";

const router = Router();

router.use(apiLimiter);

router.get("/health", (req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/team", teamRoutes);
router.use("/workspace", workspaceRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
