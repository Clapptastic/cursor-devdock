/**
 * Response API
 * Client for interacting with the Response Service API
 */

import { ApiClient } from './apiClient';
import { SurveyResponse, ResponseStatistics, ApiResponse } from '../models/types';

/**
 * API client for interacting with the Response service
 */
export class ResponseApi {
  private client: ApiClient;

  /**
   * Initialize the Response API client
   * @param baseUrl - Base URL for the response service (default is the gateway URL)
   */
  constructor(baseUrl: string = process.env.API_GATEWAY_URL || 'http://localhost:3000') {
    this.client = new ApiClient(`${baseUrl}/response`);
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
   * Get all responses
   * @param surveyId - Optional filter by survey ID
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @returns Promise with responses list
   */
  async getResponses(surveyId?: string, page: number = 1, limit: number = 10): Promise<ApiResponse<SurveyResponse[]>> {
    const params = surveyId ? { surveyId, page, limit } : { page, limit };
    return this.client.get<SurveyResponse[]>('/', params);
  }

  /**
   * Get a response by ID
   * @param id - Response ID
   * @returns Promise with response details
   */
  async getResponse(id: string): Promise<ApiResponse<SurveyResponse>> {
    return this.client.get<SurveyResponse>(`/${id}`);
  }

  /**
   * Submit a new survey response
   * @param response - Response data
   * @returns Promise with submitted response
   */
  async submitResponse(response: Partial<SurveyResponse>): Promise<ApiResponse<SurveyResponse>> {
    return this.client.post<SurveyResponse>('/', response);
  }

  /**
   * Update an existing response
   * @param id - Response ID
   * @param response - Updated response data
   * @returns Promise with updated response
   */
  async updateResponse(id: string, response: Partial<SurveyResponse>): Promise<ApiResponse<SurveyResponse>> {
    return this.client.put<SurveyResponse>(`/${id}`, response);
  }

  /**
   * Delete a response
   * @param id - Response ID
   * @returns Promise with deletion confirmation
   */
  async deleteResponse(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(`/${id}`);
  }

  /**
   * Get statistics for a survey's responses
   * @param surveyId - Survey ID
   * @returns Promise with response statistics
   */
  async getStatistics(surveyId: string): Promise<ApiResponse<ResponseStatistics>> {
    return this.client.get<ResponseStatistics>(`/stats/${surveyId}`);
  }

  /**
   * Get responses by date range
   * @param surveyId - Survey ID
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @returns Promise with filtered responses
   */
  async getResponsesByDateRange(
    surveyId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<SurveyResponse[]>> {
    return this.client.get<SurveyResponse[]>(`/filter/date`, {
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
  async markAsReviewed(id: string, reviewNotes?: string): Promise<ApiResponse<SurveyResponse>> {
    return this.client.put<SurveyResponse>(`/${id}/review`, {
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
  async exportResponses(surveyId: string, format: 'json' | 'csv' | 'excel'): Promise<ApiResponse<Blob | object>> {
    if (format === 'csv' || format === 'excel') {
      return this.client.get<Blob>(`/export/${surveyId}`, { format }, {
        responseType: 'blob'
      });
    } else {
      return this.client.get<object>(`/export/${surveyId}`, { format });
    }
  }
} 