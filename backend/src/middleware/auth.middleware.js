import { query } from "../config/db.js";
import { verifyAccessToken } from "../services/token.service.js";
import AppError from "../utils/AppError.js";
import { toAvatarUrl } from "../models/user.model.js";
// Usage in a route file:
//   router.get("/me", authenticate, getMe);
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw AppError.unauthorized("Authentication required");
    }

    // Throws a 401 if the token is invalid or expired
    const userId = verifyAccessToken(token);

    const { rows } = await query(
       `SELECT u.id, u.name, u.email, u.role, u.email_verified, u.avatar_file, u.is_demo,
              u.workspace_id, w.name AS workspace_name
       FROM users u
       LEFT JOIN workspaces w ON w.id = u.workspace_id
       WHERE u.id = $1`,
      [userId]
    );

    const row = rows[0];

    // The account was deleted after the token was issued
    if (!row) {
      throw AppError.unauthorized("Account no longer exists");
    }

    if (!row.email_verified) {
      throw AppError.forbidden("Please verify your email first");
    }

    // Same shape the frontend's AuthContext expects for "user"
    req.user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      emailVerified: row.email_verified,
      workspaceId: row.workspace_id,
      workspaceName: row.workspace_name,
      avatarUrl: toAvatarUrl(row.avatar_file),
      isDemo: row.is_demo,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;
