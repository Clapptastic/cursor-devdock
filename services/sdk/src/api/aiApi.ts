/**
 * AI API
 * Client for interacting with the AI Service API
 */

import { ApiClient } from './apiClient';
import { 
  TextAnalysis, 
  Insights, 
  SurveyRecommendation, 
  InsightRequest, 
  SurveyResponse,
  ApiResponse,
  ResponseInsights
} from '../models/types';

/**
 * API client for interacting with the AI service
 */
export class AiApi {
  private client: ApiClient;

  /**
   * Initialize the AI API client
   * @param baseUrl - Base URL for the AI service (default is the gateway URL)
   */
  constructor(baseUrl: string = process.env.API_GATEWAY_URL || 'http://localhost:3000') {
    this.client = new ApiClient(`${baseUrl}/ai`);
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
   * Analyze text for sentiment and key topics
   * @param text - Text to analyze
   * @returns Promise with analysis results
   */
  async analyzeText(text: string): Promise<ApiResponse<TextAnalysis>> {
    return this.client.post<TextAnalysis>('/analyze/text', { text });
  }

  /**
   * Get insights from a set of survey responses
   * @param responses - Array of survey responses to analyze
   * @returns Promise with response insights
   */
  async getInsights(responses: SurveyResponse[]): Promise<ApiResponse<ResponseInsights>> {
    return this.client.post<ResponseInsights>('/insights', { responses });
  }

  /**
   * Get AI-generated survey recommendations
   * @param goal - Survey goal (e.g., 'customer_satisfaction', 'product_feedback')
   * @param industry - Optional industry context
   * @param targetAudience - Optional target audience
   * @returns Promise with survey recommendations
   */
  async getSurveyRecommendations(
    goal: string,
    industry?: string,
    targetAudience?: string
  ): Promise<ApiResponse<SurveyRecommendation>> {
    return this.client.post<SurveyRecommendation>('/recommend/survey', {
      goal,
      industry,
      targetAudience
    });
  }

  /**
   * Generate summary report from survey responses
   * @param surveyId - Survey ID
   * @param format - Report format ('pdf', 'json')
   * @returns Promise with generated report
   */
  async generateReport(
    surveyId: string,
    format: 'pdf' | 'json' = 'json'
  ): Promise<ApiResponse<Blob | object>> {
    if (format === 'pdf') {
      return this.client.get<Blob>(`/report/${surveyId}`, { format }, {
        responseType: 'blob'
      });
    } else {
      return this.client.get<object>(`/report/${surveyId}`, { format });
    }
  }

  /**
   * Get trending topics from recent responses
   * @param surveyId - Optional survey ID to filter responses
   * @param days - Number of days to look back (default: 30)
   * @returns Promise with trending topics
   */
  async getTrendingTopics(
    surveyId?: string,
    days: number = 30
  ): Promise<ApiResponse<{ topics: Array<{ name: string; count: number; sentiment: number }> }>> {
    const params = surveyId ? { surveyId, days } : { days };
    return this.client.get<{ topics: Array<{ name: string; count: number; sentiment: number }> }>('/trends/topics', params);
  }

  /**
   * Compare sentiment across multiple surveys
   * @param surveyIds - Array of survey IDs to compare
   * @returns Promise with sentiment comparison
   */
  async compareSentiment(
    surveyIds: string[]
  ): Promise<ApiResponse<{ surveys: Array<{ id: string; name: string; sentiment: number }> }>> {
    return this.client.post<{ surveys: Array<{ id: string; name: string; sentiment: number }> }>(
      '/compare/sentiment',
      { surveyIds }
    );
  }

  /**
   * Generate insights from survey responses
   * @param request - Insight request with survey ID and optional filters
   * @returns Promise resolving to generated insights
   */
  public async generateInsights(request: InsightRequest): Promise<ApiResponse<Insights>> {
    return this.client.post<Insights>('/insights', request);
  }

  /**
   * Analyze a batch of responses for trends and patterns
   * @param responses - Array of survey responses to analyze
   * @returns Promise resolving to insights from the analysis
   */
  public async batchAnalyzeResponses(responses: SurveyResponse[]): Promise<Insights> {
    return this.client.post<Insights>('/analyze/batch', { responses });
  }

  /**
   * Generate suggested follow-up questions based on a response
   * @param responseId - ID of the response to analyze
   * @param maxQuestions - Maximum number of questions to generate (default: 3)
   * @returns Promise resolving to an array of suggested questions
   */
  public async generateFollowUpQuestions(
    responseId: string,
    maxQuestions: number = 3
  ): Promise<string[]> {
    return this.client.get<string[]>(`/followup/${responseId}`, { maxQuestions });
  }

  /**
   * Get the health status of the AI service
   * @returns Promise resolving to the health status
   */
  public async getHealth(): Promise<ApiResponse<{ status: string }>> {
    return this.client.get<{ status: string }>('/health');
  }
} 