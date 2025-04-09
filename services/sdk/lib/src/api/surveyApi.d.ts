/**
 * Survey API
 * Client for interacting with the Survey Service API
 */
import { Survey, ApiResponse, ExportOptions } from '../models/types';
/**
 * API client for interacting with the Survey service
 */
export declare class SurveyApi {
    private client;
    /**
     * Initialize the Survey API client
     * @param baseUrl - Base URL for the survey service (default is the gateway URL)
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
     * Get all surveys
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with surveys list
     */
    getSurveys(page?: number, limit?: number): Promise<ApiResponse<Survey[]>>;
    /**
     * Get a survey by ID
     * @param id - Survey ID
     * @returns Promise with survey details
     */
    getSurvey(id: string): Promise<ApiResponse<Survey>>;
    /**
     * Create a new survey
     * @param survey - Survey data
     * @returns Promise with created survey
     */
    createSurvey(survey: Partial<Survey>): Promise<ApiResponse<Survey>>;
    /**
     * Update an existing survey
     * @param id - Survey ID
     * @param survey - Updated survey data
     * @returns Promise with updated survey
     */
    updateSurvey(id: string, survey: Partial<Survey>): Promise<ApiResponse<Survey>>;
    /**
     * Delete a survey
     * @param id - Survey ID
     * @returns Promise with deletion confirmation
     */
    deleteSurvey(id: string): Promise<ApiResponse<{
        success: boolean;
    }>>;
    /**
     * Get a public survey by ID (no authentication required)
     * @param id - Survey ID
     * @returns Promise with public survey details
     */
    getPublicSurvey(id: string): Promise<ApiResponse<Survey>>;
    /**
     * Export survey data
     * @param id - Survey ID
     * @param options - Export options
     * @returns Promise with exported data
     */
    exportSurvey(id: string, options: ExportOptions): Promise<ApiResponse<Blob | object>>;
    /**
     * Publish a survey (make it available for responses)
     * @param id - Survey ID
     * @returns Promise with published survey
     */
    publishSurvey(id: string): Promise<ApiResponse<Survey>>;
    /**
     * Unpublish a survey
     * @param id - Survey ID
     * @returns Promise with unpublished survey
     */
    unpublishSurvey(id: string): Promise<ApiResponse<Survey>>;
    /**
     * Clone an existing survey
     * @param id - Original survey ID
     * @param title - Optional new title for the cloned survey
     * @returns Promise with cloned survey
     */
    cloneSurvey(id: string, title?: string): Promise<ApiResponse<Survey>>;
}
