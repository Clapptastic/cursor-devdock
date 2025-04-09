/**
 * Survey API
 * Client for interacting with the Survey Service API
 */

import { ApiClient } from './apiClient';
import { Survey, ApiResponse, ExportOptions } from '../models/types';

/**
 * API client for interacting with the Survey service
 */
export class SurveyApi {
  private client: ApiClient;

  /**
   * Initialize the Survey API client
   * @param baseUrl - Base URL for the survey service (default is the gateway URL)
   */
  constructor(baseUrl: string = process.env.API_GATEWAY_URL || 'http://localhost:3000') {
    this.client = new ApiClient(`${baseUrl}/survey`);
  }

  /**
   * Set authorization token for authenticated requests
   * @param token - JWT token
   */
  setAuthToken(token: string): void {
    this.client.setAuthToken(token);
  }

  /**
   * Clear the authorization token
   */
  clearAuthToken(): void {
    this.client.clearAuthToken();
  }

  /**
   * Get all surveys
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @returns Promise with surveys list
   */
  async getSurveys(page: number = 1, limit: number = 10): Promise<ApiResponse<Survey[]>> {
    return this.client.get<Survey[]>('/', { page, limit });
  }

  /**
   * Get a survey by ID
   * @param id - Survey ID
   * @returns Promise with survey details
   */
  async getSurvey(id: string): Promise<ApiResponse<Survey>> {
    return this.client.get<Survey>(`/${id}`);
  }

  /**
   * Create a new survey
   * @param survey - Survey data
   * @returns Promise with created survey
   */
  async createSurvey(survey: Partial<Survey>): Promise<ApiResponse<Survey>> {
    return this.client.post<Survey>('/', survey);
  }

  /**
   * Update an existing survey
   * @param id - Survey ID
   * @param survey - Updated survey data
   * @returns Promise with updated survey
   */
  async updateSurvey(id: string, survey: Partial<Survey>): Promise<ApiResponse<Survey>> {
    return this.client.put<Survey>(`/${id}`, survey);
  }

  /**
   * Delete a survey
   * @param id - Survey ID
   * @returns Promise with deletion confirmation
   */
  async deleteSurvey(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(`/${id}`);
  }

  /**
   * Get a public survey by ID (no authentication required)
   * @param id - Survey ID
   * @returns Promise with public survey details
   */
  async getPublicSurvey(id: string): Promise<ApiResponse<Survey>> {
    return this.client.get<Survey>(`/public/survey/${id}`);
  }

  /**
   * Export survey data
   * @param id - Survey ID
   * @param options - Export options
   * @returns Promise with exported data
   */
  async exportSurvey(id: string, options: ExportOptions): Promise<ApiResponse<Blob | object>> {
    const { format, includeMetadata, anonymize } = options;
    
    if (format === 'pdf' || format === 'csv') {
      return this.client.get<Blob>(`/${id}/export`, { format, includeMetadata, anonymize }, {
        responseType: 'blob'
      });
    } else {
      return this.client.get<object>(`/${id}/export`, { format, includeMetadata, anonymize });
    }
  }

  /**
   * Publish a survey (make it available for responses)
   * @param id - Survey ID
   * @returns Promise with published survey
   */
  async publishSurvey(id: string): Promise<ApiResponse<Survey>> {
    return this.client.put<Survey>(`/${id}/publish`, { published: true });
  }

  /**
   * Unpublish a survey
   * @param id - Survey ID
   * @returns Promise with unpublished survey
   */
  async unpublishSurvey(id: string): Promise<ApiResponse<Survey>> {
    return this.client.put<Survey>(`/${id}/publish`, { published: false });
  }

  /**
   * Clone an existing survey
   * @param id - Original survey ID
   * @param title - Optional new title for the cloned survey
   * @returns Promise with cloned survey
   */
  async cloneSurvey(id: string, title?: string): Promise<ApiResponse<Survey>> {
    return this.client.post<Survey>(`/${id}/clone`, { title });
  }
} 