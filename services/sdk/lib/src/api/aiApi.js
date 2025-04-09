"use strict";
/**
 * AI API
 * Client for interacting with the AI Service API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiApi = void 0;
const apiClient_1 = require("./apiClient");
/**
 * API client for interacting with the AI service
 */
class AiApi {
    /**
     * Initialize the AI API client
     * @param baseUrl - Base URL for the AI service (default is the gateway URL)
     */
    constructor(baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000') {
        this.client = new apiClient_1.ApiClient(`${baseUrl}/ai`);
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
     * Analyze text for sentiment and key topics
     * @param text - Text to analyze
     * @returns Promise with analysis results
     */
    async analyzeText(text) {
        return this.client.post('/analyze/text', { text });
    }
    /**
     * Get insights from a set of survey responses
     * @param responses - Array of survey responses to analyze
     * @returns Promise with response insights
     */
    async getInsights(responses) {
        return this.client.post('/insights', { responses });
    }
    /**
     * Get AI-generated survey recommendations
     * @param goal - Survey goal (e.g., 'customer_satisfaction', 'product_feedback')
     * @param industry - Optional industry context
     * @param targetAudience - Optional target audience
     * @returns Promise with survey recommendations
     */
    async getSurveyRecommendations(goal, industry, targetAudience) {
        return this.client.post('/recommend/survey', {
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
    async generateReport(surveyId, format = 'json') {
        if (format === 'pdf') {
            return this.client.get(`/report/${surveyId}`, { format }, {
                responseType: 'blob'
            });
        }
        else {
            return this.client.get(`/report/${surveyId}`, { format });
        }
    }
    /**
     * Get trending topics from recent responses
     * @param surveyId - Optional survey ID to filter responses
     * @param days - Number of days to look back (default: 30)
     * @returns Promise with trending topics
     */
    async getTrendingTopics(surveyId, days = 30) {
        const params = surveyId ? { surveyId, days } : { days };
        return this.client.get('/trends/topics', params);
    }
    /**
     * Compare sentiment across multiple surveys
     * @param surveyIds - Array of survey IDs to compare
     * @returns Promise with sentiment comparison
     */
    async compareSentiment(surveyIds) {
        return this.client.post('/compare/sentiment', { surveyIds });
    }
    /**
     * Generate insights from survey responses
     * @param request - Insight request with survey ID and optional filters
     * @returns Promise resolving to generated insights
     */
    async generateInsights(request) {
        return this.client.post('/insights', request);
    }
    /**
     * Analyze a batch of responses for trends and patterns
     * @param responses - Array of survey responses to analyze
     * @returns Promise resolving to insights from the analysis
     */
    async batchAnalyzeResponses(responses) {
        return this.client.post('/analyze/batch', { responses });
    }
    /**
     * Generate suggested follow-up questions based on a response
     * @param responseId - ID of the response to analyze
     * @param maxQuestions - Maximum number of questions to generate (default: 3)
     * @returns Promise resolving to an array of suggested questions
     */
    async generateFollowUpQuestions(responseId, maxQuestions = 3) {
        return this.client.get(`/followup/${responseId}`, { maxQuestions });
    }
    /**
     * Get the health status of the AI service
     * @returns Promise resolving to the health status
     */
    async getHealth() {
        return this.client.get('/health');
    }
}
exports.AiApi = AiApi;
