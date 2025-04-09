/**
 * Custom Error Classes
 * Defines custom error types for better error handling
 */

class BaseError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message = 'Validation error') {
    super(message, 400);
    this.details = null;
  }

  setDetails(details) {
    this.details = details;
    return this;
  }
}

class AuthenticationError extends BaseError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends BaseError {
  constructor(message = 'Permission denied') {
    super(message, 403);
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends BaseError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}

class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service unavailable') {
    super(message, 503);
  }
}

module.exports = {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError
}; 