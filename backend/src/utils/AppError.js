export default class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    // Marks errors we threw on purpose (safe to show to the user),
    // as opposed to unexpected bugs (which must stay hidden).
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request") {
    return new AppError(message, 400);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401);
  }

  static forbidden(message = "You don't have permission to do this") {
    return new AppError(message, 403);
  }

  static notFound(message = "Not found") {
    return new AppError(message, 404);
  }

  static conflict(message = "This already exists") {
    return new AppError(message, 409);
  }
}
