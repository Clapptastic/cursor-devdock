/**
 * Customer Survey SDK
 * JavaScript client library for the Customer Survey Platform API
 */

class CustomerSurveySDK {
  /**
   * Create a new instance of the Customer Survey SDK
   * @param {Object} config - Configuration options
   * @param {string} config.apiUrl - API URL (required)
   * @param {boolean} [config.debug=false] - Enable debug mode
   */
  constructor(config = {}) {
    if (!config.apiUrl) {
      throw new Error('API URL is required');
    }
    
    this.apiUrl = config.apiUrl;
    this.debug = config.debug || false;
    this.authToken = null;
  }

  /**
   * Set authentication token for API calls
   * @param {string} token - Authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Get the current authentication token
   * @returns {string|null} Current authentication token
   */
  getAuthToken() {
    return this.authToken;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Make an API request
   * @param {string} path - API path
   * @param {Object} options - Request options
   * @returns {Promise<any>} API response
   * @private
   */
  async _request(path, options = {}) {
    const url = `${this.apiUrl}${path}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    const requestOptions = {
      ...options,
      headers
    };
    
    try {
      if (this.debug) {
        console.log(`API Request: ${url}`, requestOptions);
      }
      
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(`API Error: ${data.error || 'Unknown error'}`);
        error.code = data.code || response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      if (this.debug) {
        console.error('API Error:', error);
      }
      throw error;
    }
  }

  // Survey API Methods

  /**
   * Get all surveys
   * @returns {Promise<Array>} List of surveys
   */
  async getAllSurveys() {
    return this._request('/surveys');
  }

  /**
   * Get a survey by ID
   * @param {string} id - Survey ID
   * @returns {Promise<Object>} Survey data
   */
  async getSurveyById(id) {
    return this._request(`/surveys/${id}`);
  }

  /**
   * Create a new survey
   * @param {Object} surveyData - Survey data
   * @returns {Promise<Object>} Created survey
   */
  async createSurvey(surveyData) {
    return this._request('/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData)
    });
  }

  /**
   * Update an existing survey
   * @param {string} id - Survey ID
   * @param {Object} surveyData - Updated survey data
   * @returns {Promise<Object>} Updated survey
   */
  async updateSurvey(id, surveyData) {
    return this._request(`/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(surveyData)
    });
  }

  /**
   * Delete a survey
   * @param {string} id - Survey ID
   * @returns {Promise<void>}
   */
  async deleteSurvey(id) {
    return this._request(`/surveys/${id}`, {
      method: 'DELETE'
    });
  }

  // Response API Methods

  /**
   * Get responses for a survey
   * @param {string} surveyId - Survey ID
   * @returns {Promise<Array>} List of responses
   */
  async getSurveyResponses(surveyId) {
    return this._request(`/responses?surveyId=${surveyId}`);
  }

  /**
   * Submit a survey response
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} Submitted response
   */
  async submitResponse(responseData) {
    return this._request('/responses', {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
  }

  // AI API Methods

  /**
   * Analyze text using AI
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeText(text) {
    return this._request('/ai/analyze/text', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  /**
   * Get insights from survey responses
   * @param {string} surveyId - Survey ID
   * @returns {Promise<Object>} Insights data
   */
  async getInsights(surveyId) {
    return this._request('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ surveyId })
    });
  }
}

module.exports = { CustomerSurveySDK }; 