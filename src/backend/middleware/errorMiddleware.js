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
 * Handles all errors in the application
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Set status code (use 500 if statusCode is not set or is 200)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Set status code and format response
  res.status(statusCode);
  
  // Format error response based on environment
  const errorResponse = {
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  };
  
  // Log error information
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // Send error response
  res.json(errorResponse);
};

module.exports = { notFound, errorHandler }; 