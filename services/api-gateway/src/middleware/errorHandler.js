/**
 * Error Handler Middleware
 * 
 * Provides centralized error handling for the API Gateway.
 * Formats error responses consistently and logs errors for monitoring.
 */

/**
 * Normalize error objects into a consistent format
 * @param {Error} err - The error object 
 * @returns {Object} Normalized error with status code and message
 */
const normalizeError = (err) => {
  // Default error structure
  const error = {
    statusCode: 500,
    message: 'Internal Server Error',
    details: null
  };

  // Handle known error types
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = 'Validation Error';
    error.details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError' || err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Authentication Error';
    error.details = err.message;
  } else if (err.name === 'ForbiddenError') {
    error.statusCode = 403;
    error.message = 'Forbidden';
    error.details = err.message;
  } else if (err.name === 'NotFoundError') {
    error.statusCode = 404;
    error.message = 'Not Found';
    error.details = err.message;
  } else if (err.name === 'ConflictError') {
    error.statusCode = 409;
    error.message = 'Conflict';
    error.details = err.message;
  } else if (err.response) {
    // Error from axios/proxy
    error.statusCode = err.response.status;
    error.message = err.response.statusText || 'Service Error';
    error.details = err.response.data;
  }

  // If error has its own status code and message, use those
  if (err.statusCode) error.statusCode = err.statusCode;
  if (err.message) error.message = err.message;
  
  return error;
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Normalize the error
  const normalizedError = normalizeError(err);
  
  // Log the error
  const errorLog = {
    path: req.path,
    method: req.method,
    statusCode: normalizedError.statusCode,
    message: normalizedError.message,
    details: normalizedError.details,
    timestamp: new Date().toISOString(),
    requestId: req.id, // Assuming request ID middleware is in use
    userId: req.user ? req.user.id : 'anonymous'
  };
  
  // Log different levels based on status code
  if (normalizedError.statusCode >= 500) {
    console.error('Server Error:', errorLog, err.stack);
  } else if (normalizedError.statusCode >= 400) {
    console.warn('Client Error:', errorLog);
  } else {
    console.info('Error:', errorLog);
  }
  
  // Send response
  return res.status(normalizedError.statusCode).json({
    success: false,
    error: {
      message: normalizedError.message,
      ...(process.env.NODE_ENV === 'development' && { details: normalizedError.details })
    }
  });
};

module.exports = errorHandler; 