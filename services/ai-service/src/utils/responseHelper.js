/**
 * Response Helper Utility
 * Standardizes API responses across all endpoints
 */

/**
 * Creates a success response
 * @param {Object} data - The data to send back
 * @param {String} message - Optional success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized success response object
 */
const successResponse = (data = null, message = 'Operation successful', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data
  };
};

/**
 * Creates an error response
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error response object
 */
const errorResponse = (message = 'Internal server error', statusCode = 500, details = null) => {
  return {
    success: false,
    statusCode,
    error: {
      message,
      details
    }
  };
};

/**
 * Creates a response with partial results, used when some operations succeed and others fail
 * @param {Object} data - The successful data to send back
 * @param {Array} errors - Array of errors that occurred
 * @param {String} message - Optional message
 * @returns {Object} Standardized partial success response
 */
const partialSuccessResponse = (data = null, errors = [], message = 'Partial success') => {
  return {
    success: true,
    statusCode: 207,
    message,
    data,
    errors
  };
};

/**
 * Creates an accepted response for asynchronous operations
 * @param {String} message - Information about the async operation
 * @param {String} jobId - Optional job ID for tracking
 * @returns {Object} Standardized accepted response
 */
const acceptedResponse = (message = 'Request accepted, processing', jobId = null) => {
  return {
    success: true,
    statusCode: 202,
    message,
    jobId
  };
};

module.exports = {
  successResponse,
  errorResponse,
  partialSuccessResponse,
  acceptedResponse
}; 