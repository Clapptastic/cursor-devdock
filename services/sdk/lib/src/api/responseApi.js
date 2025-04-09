"use strict";
/**
 * Response API
 * Client for interacting with the Response Service API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseApi = void 0;
const apiClient_1 = require("./apiClient");
/**
 * API client for interacting with the Response service
 */
class ResponseApi {
    /**
     * Initialize the Response API client
     * @param baseUrl - Base URL for the response service (default is the gateway URL)
     */
    constructor(baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000') {
        this.client = new apiClient_1.ApiClient(`${baseUrl}/response`);
    }
    /**
     * Set authorization token for authenticated requests
     * @param token - JWT token
     */
    setAuthToken(token) {
        this.client.setAuthToken(token);
    }
    /**
     * Clear the authorization token
     */
    clearAuthToken() {
        this.client.clearAuthToken();
    }
    /**
     * Get all responses
     * @param surveyId - Optional filter by survey ID
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with responses list
     */
    async getResponses(surveyId, page = 1, limit = 10) {
        const params = surveyId ? { surveyId, page, limit } : { page, limit };
        return this.client.get('/', params);
    }
    /**
     * Get a response by ID
     * @param id - Response ID
     * @returns Promise with response details
     */
    async getResponse(id) {
        return this.client.get(`/${id}`);
    }
    /**
     * Submit a new survey response
     * @param response - Response data
     * @returns Promise with submitted response
     */
    async submitResponse(response) {
        return this.client.post('/', response);
    }
    /**
     * Update an existing response
     * @param id - Response ID
     * @param response - Updated response data
     * @returns Promise with updated response
     */
    async updateResponse(id, response) {
        return this.client.put(`/${id}`, response);
    }
    /**
     * Delete a response
     * @param id - Response ID
     * @returns Promise with deletion confirmation
     */
    async deleteResponse(id) {
        return this.client.delete(`/${id}`);
    }
    /**
     * Get statistics for a survey's responses
     * @param surveyId - Survey ID
     * @returns Promise with response statistics
     */
    async getStatistics(surveyId) {
        return this.client.get(`/stats/${surveyId}`);
    }
    /**
     * Get responses by date range
     * @param surveyId - Survey ID
     * @param startDate - Start date (ISO string)
     * @param endDate - End date (ISO string)
     * @returns Promise with filtered responses
     */
    async getResponsesByDateRange(surveyId, startDate, endDate) {
        return this.client.get(`/filter/date`, {
            surveyId,
            startDate,
            endDate
        });
    }
    /**
     * Mark a response as reviewed
     * @param id - Response ID
     * @param reviewNotes - Optional review notes
     * @returns Promise with updated response
     */
    async markAsReviewed(id, reviewNotes) {
        return this.client.put(`/${id}/review`, {
            reviewed: true,
            reviewNotes
        });
    }
    /**
     * Export responses for a survey
     * @param surveyId - Survey ID
     * @param format - Export format ('json', 'csv', 'excel')
     * @returns Promise with exported data
     */
    async exportResponses(surveyId, format) {
        if (format === 'csv' || format === 'excel') {
            return this.client.get(`/export/${surveyId}`, { format }, {
                responseType: 'blob'
            });
        }
        else {
            return this.client.get(`/export/${surveyId}`, { format });
        }
    }
}
exports.ResponseApi = ResponseApi;
