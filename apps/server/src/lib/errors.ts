/**
 * Custom error classes for the application.
 * All errors extend AppError which provides statusCode, code, and details.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code?: string, details?: unknown) {
    super(404, message, code ?? 'NOT_FOUND', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', code?: string, details?: unknown) {
    super(400, message, code ?? 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict — resource was modified', code?: string, details?: unknown) {
    super(409, message, code ?? 'CONFLICT', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code?: string, details?: unknown) {
    super(401, message, code ?? 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code?: string, details?: unknown) {
    super(403, message, code ?? 'FORBIDDEN', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code?: string, details?: unknown) {
    super(429, message, code ?? 'TOO_MANY_REQUESTS', details);
  }
}
