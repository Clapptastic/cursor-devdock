/**
 * AI API
 * Client for interacting with the AI Service API
 */
import { TextAnalysis, Insights, SurveyRecommendation, InsightRequest, SurveyResponse, ApiResponse, ResponseInsights } from '../models/types';
/**
 * API client for interacting with the AI service
 */
export declare class AiApi {
    private client;
    /**
     * Initialize the AI API client
     * @param baseUrl - Base URL for the AI service (default is the gateway URL)
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
     * Analyze text for sentiment and key topics
     * @param text - Text to analyze
     * @returns Promise with analysis results
     */
    analyzeText(text: string): Promise<ApiResponse<TextAnalysis>>;
    /**
     * Get insights from a set of survey responses
     * @param responses - Array of survey responses to analyze
     * @returns Promise with response insights
     */
    getInsights(responses: SurveyResponse[]): Promise<ApiResponse<ResponseInsights>>;
    /**
     * Get AI-generated survey recommendations
     * @param goal - Survey goal (e.g., 'customer_satisfaction', 'product_feedback')
     * @param industry - Optional industry context
     * @param targetAudience - Optional target audience
     * @returns Promise with survey recommendations
     */
    getSurveyRecommendations(goal: string, industry?: string, targetAudience?: string): Promise<ApiResponse<SurveyRecommendation>>;
    /**
     * Generate summary report from survey responses
     * @param surveyId - Survey ID
     * @param format - Report format ('pdf', 'json')
     * @returns Promise with generated report
     */
    generateReport(surveyId: string, format?: 'pdf' | 'json'): Promise<ApiResponse<Blob | object>>;
    /**
     * Get trending topics from recent responses
     * @param surveyId - Optional survey ID to filter responses
     * @param days - Number of days to look back (default: 30)
     * @returns Promise with trending topics
     */
    getTrendingTopics(surveyId?: string, days?: number): Promise<ApiResponse<{
        topics: Array<{
            name: string;
            count: number;
            sentiment: number;
        }>;
    }>>;
    /**
     * Compare sentiment across multiple surveys
     * @param surveyIds - Array of survey IDs to compare
     * @returns Promise with sentiment comparison
     */
    compareSentiment(surveyIds: string[]): Promise<ApiResponse<{
        surveys: Array<{
            id: string;
            name: string;
            sentiment: number;
        }>;
    }>>;
    /**
     * Generate insights from survey responses
     * @param request - Insight request with survey ID and optional filters
     * @returns Promise resolving to generated insights
     */
    generateInsights(request: InsightRequest): Promise<ApiResponse<Insights>>;
    /**
     * Analyze a batch of responses for trends and patterns
     * @param responses - Array of survey responses to analyze
     * @returns Promise resolving to insights from the analysis
     */
    batchAnalyzeResponses(responses: SurveyResponse[]): Promise<Insights>;
    /**
     * Generate suggested follow-up questions based on a response
     * @param responseId - ID of the response to analyze
     * @param maxQuestions - Maximum number of questions to generate (default: 3)
     * @returns Promise resolving to an array of suggested questions
     */
    generateFollowUpQuestions(responseId: string, maxQuestions?: number): Promise<string[]>;
    /**
     * Get the health status of the AI service
     * @returns Promise resolving to the health status
     */
    getHealth(): Promise<ApiResponse<{
        status: string;
    }>>;
}
