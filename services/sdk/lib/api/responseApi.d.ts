/**
 * Response API
 * Client for interacting with the Response Service API
 */
import { SurveyResponse, ResponseStatistics, ApiResponse } from '../models/types';
/**
 * API client for interacting with the Response service
 */
export declare class ResponseApi {
    private client;
    /**
     * Initialize the Response API client
     * @param baseUrl - Base URL for the response service (default is the gateway URL)
     */
    constructor(baseUrl?: string);
    /**
     * Set authorization token for authenticated requests
     * @param token - JWT token
     */
    setAuthToken(token: string): void;
    /**
     * Clear the authorization token
     */
    clearAuthToken(): void;
    /**
     * Get all responses
     * @param surveyId - Optional filter by survey ID
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with responses list
     */
    getResponses(surveyId?: string, page?: number, limit?: number): Promise<ApiResponse<SurveyResponse[]>>;
    /**
     * Get a response by ID
     * @param id - Response ID
     * @returns Promise with response details
     */
    getResponse(id: string): Promise<ApiResponse<SurveyResponse>>;
    /**
     * Submit a new survey response
     * @param response - Response data
     * @returns Promise with submitted response
     */
    submitResponse(response: Partial<SurveyResponse>): Promise<ApiResponse<SurveyResponse>>;
    /**
     * Update an existing response
     * @param id - Response ID
     * @param response - Updated response data
     * @returns Promise with updated response
     */
    updateResponse(id: string, response: Partial<SurveyResponse>): Promise<ApiResponse<SurveyResponse>>;
    /**
     * Delete a response
     * @param id - Response ID
     * @returns Promise with deletion confirmation
     */
    deleteResponse(id: string): Promise<ApiResponse<{
        success: boolean;
    }>>;
    /**
     * Get statistics for a survey's responses
     * @param surveyId - Survey ID
     * @returns Promise with response statistics
     */
    getStatistics(surveyId: string): Promise<ApiResponse<ResponseStatistics>>;
    /**
     * Get responses by date range
     * @param surveyId - Survey ID
     * @param startDate - Start date (ISO string)
     * @param endDate - End date (ISO string)
     * @returns Promise with filtered responses
     */
    getResponsesByDateRange(surveyId: string, startDate: string, endDate: string): Promise<ApiResponse<SurveyResponse[]>>;
    /**
     * Mark a response as reviewed
     * @param id - Response ID
     * @param reviewNotes - Optional review notes
     * @returns Promise with updated response
     */
    markAsReviewed(id: string, reviewNotes?: string): Promise<ApiResponse<SurveyResponse>>;
    /**
     * Export responses for a survey
     * @param surveyId - Survey ID
     * @param format - Export format ('json', 'csv', 'excel')
     * @returns Promise with exported data
     */
    exportResponses(surveyId: string, format: 'json' | 'csv' | 'excel'): Promise<ApiResponse<Blob | object>>;
}
