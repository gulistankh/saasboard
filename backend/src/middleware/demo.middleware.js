import AppError from "../utils/AppError.js";

// Put this on routes that demo users must not use (always AFTER authenticate)
export const blockDemo = (req, res, next) => {
  if (req.user?.isDemo) {
    return next(AppError.forbidden("This action is disabled in the demo."));
  }
  next();
};

export default blockDemo;
