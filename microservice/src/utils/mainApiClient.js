/**
 * Utility client for communicating with the main Customer Survey application API
 */
const axios = require('axios');

// Create an axios instance with default configuration
const mainApiClient = axios.create({
  baseURL: process.env.MAIN_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Make a request to the main API
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} options.endpoint - API endpoint without leading slash
 * @param {Object} options.data - Request body data
 * @param {Object} options.params - Query parameters
 * @param {string} options.token - Authentication token from main application
 * @returns {Promise<Object>} - API response data
 */
const callMainApi = async ({ method = 'GET', endpoint, data, params, token }) => {
  try {
    // Set up request config
    const config = {
      method,
      url: endpoint,
      data,
      params
    };
    
    // Add auth token if provided
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    // Make the request
    const response = await mainApiClient(config);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const errorStatus = error.response?.status || 500;
    
    // Create structured error object
    const apiError = new Error(`Main API error: ${errorMsg}`);
    apiError.status = errorStatus;
    apiError.data = error.response?.data;
    apiError.originalError = error;
    
    throw apiError;
  }
};

// Wrapper functions for common API calls

/**
 * Get user data from main API
 * @param {string} token - JWT token from main application
 * @returns {Promise<Object>} - User data
 */
const getUserProfile = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }
  
  return callMainApi({
    method: 'GET',
    endpoint: 'api/users/profile',
    token
  });
};

/**
 * Get survey data from main API
 * @param {string} surveyId - Survey ID
 * @param {string} token - JWT token from main application
 * @returns {Promise<Object>} - Survey data
 */
const getSurvey = async (surveyId, token) => {
  if (!surveyId) {
    throw new Error('Survey ID is required');
  }
  
  return callMainApi({
    method: 'GET',
    endpoint: `api/surveys/${surveyId}`,
    token
  });
};

/**
 * Get responses for a survey from main API
 * @param {string} surveyId - Survey ID
 * @param {string} token - JWT token from main application
 * @returns {Promise<Object>} - Survey responses
 */
const getSurveyResponses = async (surveyId, token) => {
  if (!surveyId) {
    throw new Error('Survey ID is required');
  }
  
  return callMainApi({
    method: 'GET',
    endpoint: `api/surveys/${surveyId}/responses`,
    token
  });
};

module.exports = {
  callMainApi,
  getUserProfile,
  getSurvey,
  getSurveyResponses
}; 