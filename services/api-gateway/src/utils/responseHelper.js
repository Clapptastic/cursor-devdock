/**
 * Response Helper Utility
 * Standardizes API responses across all services
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
 * Creates a paginated response
 * @param {Array} data - The data to send back
 * @param {Number} total - Total number of records
 * @param {Number} limit - Records per page
 * @param {Number} offset - Starting position
 * @param {String} message - Optional success message
 * @returns {Object} Standardized paginated response object
 */
const paginatedResponse = (data = [], total = 0, limit = 10, offset = 0, message = 'Operation successful') => {
  return {
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    }
  };
};

/**
 * Creates a no content response (204)
 * @returns {Object} Standardized no content response object
 */
const noContentResponse = () => {
  return {
    success: true,
    statusCode: 204,
    message: 'No content'
  };
};

/**
 * Creates an accepted response (202) for async operations
 * @param {String} message - Information about the async operation
 * @param {String} jobId - Optional job ID for tracking
 * @returns {Object} Standardized accepted response object
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
  paginatedResponse,
  noContentResponse,
  acceptedResponse
}; 