/**
 * Microservice Client
 * 
 * Utility functions for communicating with the Customer Survey data processing microservice.
 * This client handles API calls to the microservice endpoints and provides a simple interface
 * for the main application to use the microservice functionality.
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const MICROSERVICE_URL = process.env.MICROSERVICE_URL || 'http://localhost:3001';
const MICROSERVICE_API_KEY = process.env.MICROSERVICE_API_KEY;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: MICROSERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': MICROSERVICE_API_KEY
  },
  timeout: 30000 // 30 seconds timeout
});

/**
 * Process data through the microservice
 * 
 * @param {Array} data - The data to process
 * @param {Object} options - Processing options
 * @param {string} [options.processingType='basic'] - Level of processing ('basic', 'advanced', 'premium')
 * @param {boolean} [options.calculateScores=false] - Whether to calculate scores
 * @param {boolean} [options.includeMeta=true] - Include metadata in results
 * @param {boolean} [options.normalize=false] - Normalize numeric values
 * @param {string} [options.userId] - User ID associated with the data
 * @param {string} [options.surveyId] - Survey ID associated with the data
 * @returns {Promise<Object>} Processed data results
 * @throws {Error} If the microservice request fails
 */
const processData = async (data, options = {}) => {
  try {
    const response = await apiClient.post('/api/process', { data, options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error processing data');
  }
};

/**
 * Get previously processed data by ID
 * 
 * @param {string} id - The ID of the processed data to retrieve
 * @returns {Promise<Object>} The processed data
 * @throws {Error} If the microservice request fails
 */
const getProcessedData = async (id) => {
  try {
    const response = await apiClient.get(`/api/process/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, `Error retrieving processed data with ID: ${id}`);
  }
};

/**
 * Get all processed data (paginated)
 * 
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @param {string} [options.sort='created_at'] - Field to sort by
 * @param {string} [options.order='desc'] - Sort order ('asc' or 'desc')
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.type] - Filter by analysis type
 * @returns {Promise<Object>} List of processed data with pagination info
 * @throws {Error} If the microservice request fails
 */
const getAllProcessedData = async (options = {}) => {
  try {
    const response = await apiClient.get('/api/process', { params: options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error retrieving processed data list');
  }
};

/**
 * Delete processed data by ID
 * 
 * @param {string} id - The ID of the processed data to delete
 * @returns {Promise<Object>} Success message
 * @throws {Error} If the microservice request fails
 */
const deleteProcessedData = async (id) => {
  try {
    const response = await apiClient.delete(`/api/process/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, `Error deleting processed data with ID: ${id}`);
  }
};

/**
 * Analyze sentiment in textual survey responses
 * 
 * @param {Array} data - The textual response data to analyze
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Sentiment analysis results
 * @throws {Error} If the microservice request fails
 */
const analyzeSentiment = async (data, options = {}) => {
  try {
    const response = await apiClient.post('/api/process/sentiment', { data, options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error analyzing sentiment');
  }
};

/**
 * Extract themes from survey responses
 * 
 * @param {Array} data - The response data to analyze for themes
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Theme extraction results
 * @throws {Error} If the microservice request fails
 */
const analyzeThemes = async (data, options = {}) => {
  try {
    const response = await apiClient.post('/api/process/themes', { data, options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error extracting themes');
  }
};

/**
 * Generate insights from survey data
 * 
 * @param {Array} data - The survey data to analyze
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Insight generation results
 * @throws {Error} If the microservice request fails
 */
const generateInsights = async (data, options = {}) => {
  try {
    const response = await apiClient.post('/api/analysis/insights', { data, options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error generating insights');
  }
};

/**
 * Generate heatmap visualization data
 * 
 * @param {Array} data - The survey data for heatmap generation
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Heatmap data
 * @throws {Error} If the microservice request fails
 */
const generateHeatmap = async (data, options = {}) => {
  try {
    const response = await apiClient.post('/api/analysis/heatmap', { data, options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error generating heatmap');
  }
};

/**
 * Analyze trends between current and previous survey data
 * 
 * @param {Array} currentData - Current survey data
 * @param {Array} previousData - Previous survey data for comparison
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Trend analysis results
 * @throws {Error} If the microservice request fails
 */
const analyzeTrends = async (currentData, previousData, options = {}) => {
  try {
    const response = await apiClient.post('/api/analysis/trends', { 
      currentData, 
      previousData, 
      options 
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error analyzing trends');
  }
};

/**
 * Generate recommended next steps based on survey data
 * 
 * @param {Array} data - The survey data to analyze
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Next steps recommendations
 * @throws {Error} If the microservice request fails
 */
const generateNextSteps = async (data, options = {}) => {
  try {
    const response = await apiClient.post('/api/analysis/next-steps', { data, options });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error generating next steps');
  }
};

/**
 * Check the health status of the microservice
 * 
 * @returns {Promise<Object>} Health status information
 * @throws {Error} If the microservice is unhealthy
 */
const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Microservice health check failed');
  }
};

/**
 * Handle API errors with custom messages
 * 
 * @param {Error} error - The error object from Axios
 * @param {string} customMessage - Custom error message prefix
 * @throws {Error} Throws an error with detailed information
 */
const handleApiError = (error, customMessage) => {
  const message = customMessage || 'Microservice request failed';
  
  if (error.response) {
    // Server responded with a non-2xx status code
    const statusCode = error.response.status;
    const errorDetails = error.response.data?.error || error.response.data;
    throw new Error(`${message}: ${statusCode} - ${JSON.stringify(errorDetails)}`);
  } else if (error.request) {
    // No response received
    throw new Error(`${message}: No response received from microservice. The service may be down.`);
  } else {
    // Something else happened
    throw new Error(`${message}: ${error.message}`);
  }
};

module.exports = {
  processData,
  getProcessedData,
  getAllProcessedData,
  deleteProcessedData,
  analyzeSentiment,
  analyzeThemes,
  generateInsights,
  generateHeatmap,
  analyzeTrends,
  generateNextSteps,
  checkHealth
}; 