/**
 * Error handling middleware
 */

/**
 * Not found middleware
 * Handles 404 errors for routes that don't exist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Error handler middleware
 * Formats and returns error responses
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // If the response status is still 200, set it to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    error: {
      code: err.code || 'UNKNOWN_ERROR',
      status: statusCode,
      service: process.env.SERVICE_NAME || 'microservice'
    }
  });
};

module.exports = { notFound, errorHandler }; 