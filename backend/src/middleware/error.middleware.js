import { ZodError } from "zod";
import env from "../config/env.js";

// Unknown route: /api/does-not-exist
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Must have exactly 4 arguments so Express treats it as an error handler
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Headers already sent: let Express close the connection
  if (res.headersSent) {
    return next(err);
  }

  // 1. Errors we threw on purpose (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // 2. Validation errors from zod
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message || "Invalid data";
    return res.status(400).json({
      message,
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // 3. Malformed JSON in the request body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }

  // 4. Body too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  
    // Upload errors from multer (for example a file that is too large)
  if (err.name === "MulterError") {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      message: tooLarge
        ? "Image is too large. The maximum size is 2 MB."
        : "Invalid upload.",
    });
  }
  
  // 5. PostgreSQL errors
  if (err.code === "23505") {
    // unique_violation
    return res.status(409).json({ message: "This record already exists" });
  }
  if (err.code === "23503") {
    // foreign_key_violation
    return res.status(409).json({ message: "This record is linked to other data" });
  }
  if (err.code === "22P02") {
    // invalid_text_representation (for example a bad UUID in the URL)
    return res.status(400).json({ message: "Invalid identifier" });
  }

  // 6. Anything else is a bug: log it, hide the details
  console.error("Unexpected error:", err);
  return res.status(500).json({
    message: "Something went wrong. Please try again.",
    ...(env.isProduction ? {} : { debug: err.message }),
  });
};
