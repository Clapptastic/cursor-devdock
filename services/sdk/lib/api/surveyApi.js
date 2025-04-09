"use strict";
/**
 * Survey API
 * Client for interacting with the Survey Service API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyApi = void 0;
const apiClient_1 = require("./apiClient");
/**
 * API client for interacting with the Survey service
 */
class SurveyApi {
    /**
     * Initialize the Survey API client
     * @param baseUrl - Base URL for the survey service (default is the gateway URL)
     */
    constructor(baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000') {
        this.client = new apiClient_1.ApiClient(`${baseUrl}/survey`);
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
     * Get all surveys
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with surveys list
     */
    async getSurveys(page = 1, limit = 10) {
        return this.client.get('/', { page, limit });
    }
    /**
     * Get a survey by ID
     * @param id - Survey ID
     * @returns Promise with survey details
     */
    async getSurvey(id) {
        return this.client.get(`/${id}`);
    }
    /**
     * Create a new survey
     * @param survey - Survey data
     * @returns Promise with created survey
     */
    async createSurvey(survey) {
        return this.client.post('/', survey);
    }
    /**
     * Update an existing survey
     * @param id - Survey ID
     * @param survey - Updated survey data
     * @returns Promise with updated survey
     */
    async updateSurvey(id, survey) {
        return this.client.put(`/${id}`, survey);
    }
    /**
     * Delete a survey
     * @param id - Survey ID
     * @returns Promise with deletion confirmation
     */
    async deleteSurvey(id) {
        return this.client.delete(`/${id}`);
    }
    /**
     * Get a public survey by ID (no authentication required)
     * @param id - Survey ID
     * @returns Promise with public survey details
     */
    async getPublicSurvey(id) {
        return this.client.get(`/public/survey/${id}`);
    }
    /**
     * Export survey data
     * @param id - Survey ID
     * @param options - Export options
     * @returns Promise with exported data
     */
    async exportSurvey(id, options) {
        const { format, includeMetadata, anonymize } = options;
        if (format === 'pdf' || format === 'csv') {
            return this.client.get(`/${id}/export`, { format, includeMetadata, anonymize }, {
                responseType: 'blob'
            });
        }
        else {
            return this.client.get(`/${id}/export`, { format, includeMetadata, anonymize });
        }
    }
    /**
     * Publish a survey (make it available for responses)
     * @param id - Survey ID
     * @returns Promise with published survey
     */
    async publishSurvey(id) {
        return this.client.put(`/${id}/publish`, { published: true });
    }
    /**
     * Unpublish a survey
     * @param id - Survey ID
     * @returns Promise with unpublished survey
     */
    async unpublishSurvey(id) {
        return this.client.put(`/${id}/publish`, { published: false });
    }
    /**
     * Clone an existing survey
     * @param id - Original survey ID
     * @param title - Optional new title for the cloned survey
     * @returns Promise with cloned survey
     */
    async cloneSurvey(id, title) {
        return this.client.post(`/${id}/clone`, { title });
    }
}
exports.SurveyApi = SurveyApi;
