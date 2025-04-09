/**
 * Error Handler Middleware
 * Centralizes error handling for the AI Service
 */

const logger = require('../utils/logger');
const { BaseError } = require('../utils/errors');

/**
 * Extract the most relevant error information
 * @param {Error} err - The error to normalize
 * @returns {Object} Normalized error object
 */
const normalizeError = (err) => {
  // Default error response
  const error = {
    statusCode: err instanceof BaseError ? err.statusCode : 500,
    message: err.message || 'Internal Server Error',
    details: err.details || null
  };

  // Handle Axios errors specially
  if (err.isAxiosError) {
    error.statusCode = err.response?.status || 500;
    error.message = 'External API Error';
    error.details = {
      message: err.response?.data?.message || err.message,
      url: err.config?.url,
      method: err.config?.method?.toUpperCase()
    };
  }

  return error;
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const normalizedError = normalizeError(err);
  
  // Log details based on severity
  const logData = {
    path: req.path,
    method: req.method,
    statusCode: normalizedError.statusCode,
    errorName: err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  if (normalizedError.statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (normalizedError.statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Error', logData);
  }
  
  // Send response to client
  return res.status(normalizedError.statusCode).json({
    success: false,
    error: {
      message: normalizedError.message,
      ...(process.env.NODE_ENV === 'development' && { details: normalizedError.details })
    }
  });
};

module.exports = errorHandler; 