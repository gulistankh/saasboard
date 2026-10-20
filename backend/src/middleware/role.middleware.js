import AppError from "../utils/AppError.js";

// Usage in a route file (always AFTER authenticate):
//   router.post("/invites", authenticate, requireRole("admin"), sendInvite);
//   router.get("/members", authenticate, requireRole("admin", "member"), getMembers);
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    // authenticate must have run first. If it didn't, this is a coding
    // mistake, so we fail closed (deny) instead of letting the request through.
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("You don't have permission to do this"));
    }

    next();
  };

// Shortcut for the most common case
export const requireAdmin = requireRole("admin");

export default requireRole;
