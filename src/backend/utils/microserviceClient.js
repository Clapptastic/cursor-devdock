/**
 * Client utility for communicating with the Customer Survey microservice
 */
const axios = require('axios');

// Create an axios instance with default configuration
const microserviceClient = axios.create({
  baseURL: process.env.MICROSERVICE_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': process.env.MICROSERVICE_API_KEY
  }
});

/**
 * Process data through the microservice
 * @param {Array} data - Array of data to process
 * @param {Object} options - Processing options
 * @param {string} authToken - JWT token for forwarding user context (optional)
 * @returns {Promise<Object>} Processed data
 */
const processData = async (data, options = {}, authToken = null) => {
  try {
    // Set up request headers
    const headers = {};
    
    // Forward auth token if provided
    if (authToken) {
      headers['x-auth-token'] = authToken;
    }
    
    const response = await microserviceClient.post('/api/process', {
      data,
      options
    }, { headers });
    
    return response.data;
  } catch (error) {
    // Format error for better debugging
    const errorResponse = error.response?.data || {};
    const errorMsg = errorResponse.message || error.message;
    const errorStatus = error.response?.status || 500;
    
    console.error(`Microservice error (${errorStatus}): ${errorMsg}`);
    
    // Create and throw structured error
    const microserviceError = new Error(`Microservice error: ${errorMsg}`);
    microserviceError.status = errorStatus;
    microserviceError.data = errorResponse;
    microserviceError.originalError = error;
    
    throw microserviceError;
  }
};

/**
 * Get processed data by ID
 * @param {string} id - ID of processed data to retrieve
 * @returns {Promise<Object>} Processed data
 */
const getProcessedData = async (id) => {
  try {
    const response = await microserviceClient.get(`/api/process/${id}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const errorStatus = error.response?.status || 500;
    
    const microserviceError = new Error(`Microservice error: ${errorMsg}`);
    microserviceError.status = errorStatus;
    microserviceError.data = error.response?.data;
    
    throw microserviceError;
  }
};

/**
 * Get all processed data with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} Paginated processed data
 */
const getAllProcessedData = async (options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    
    const response = await microserviceClient.get('/api/process', {
      params: { page, limit }
    });
    
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const errorStatus = error.response?.status || 500;
    
    const microserviceError = new Error(`Microservice error: ${errorMsg}`);
    microserviceError.status = errorStatus;
    microserviceError.data = error.response?.data;
    
    throw microserviceError;
  }
};

/**
 * Check microservice health
 * @returns {Promise<Object>} Health status
 */
const checkMicroserviceHealth = async () => {
  try {
    const response = await microserviceClient.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  processData,
  getProcessedData,
  getAllProcessedData,
  checkMicroserviceHealth
}; 