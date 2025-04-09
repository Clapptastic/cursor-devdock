/**
 * Async handler middleware
 * Wraps async route handlers to catch errors and pass them to the error middleware
 * 
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 