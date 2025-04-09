/**
 * Error Handler Middleware
 * 
 * Provides centralized error handling for the Response Service
 */

const logger = require('../utils/logger');

/**
 * Normalizes error objects into a consistent format
 * @param {Error} err - The error object
 * @returns {Object} Normalized error object
 */
const normalizeError = (err) => {
  // Custom API errors
  if (err.statusCode && err.message) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || undefined
    };
  }
  
  // Joi validation errors
  if (err.isJoi) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }
  
  // Database errors
  if (err.code && (err.code.startsWith('22') || err.code.startsWith('23'))) {
    return {
      statusCode: 400,
      message: 'Database constraint violation',
      detail: err.detail || undefined
    };
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: err.name === 'TokenExpiredError' 
        ? 'Authentication token has expired' 
        : 'Invalid authentication token'
    };
  }
  
  // Default server error
  return {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  };
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const normalizedError = normalizeError(err);
  
  // Log the error
  if (normalizedError.statusCode >= 500) {
    logger.error(`Server error: ${err.message}`, { 
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else if (normalizedError.statusCode >= 400) {
    logger.warn(`Client error: ${err.message}`, {
      path: req.path,
      method: req.method
    });
  }
  
  // Send response to client
  res.status(normalizedError.statusCode).json({
    status: 'error',
    message: normalizedError.message,
    ...(normalizedError.errors && { errors: normalizedError.errors }),
    ...(normalizedError.detail && { detail: normalizedError.detail }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Not found middleware for handling undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  logger.info(`Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    status: 'error',
    message: 'Resource not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
}; 