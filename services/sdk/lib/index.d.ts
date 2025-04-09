/**
 * Customer Survey SDK
 * Main entry point for the Customer Survey Platform SDK
 */
import { AxiosRequestConfig, AxiosResponse } from 'axios';
export * from './models/types';
export interface SurveySDKConfig {
    apiUrl: string;
    token?: string;
    apiKey?: string;
    timeout?: number;
    debug?: boolean;
}
export declare class CustomerSurveyError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status: number);
}
/**
 * Main SDK class for interacting with the Customer Survey Platform
 */
export declare class CustomerSurveySDK {
    private config;
    private logger;
    private client;
    /** API client for survey operations */
    survey: SurveyService;
    /** API client for response operations */
    response: ResponseService;
    /** API client for AI operations */
    ai: AIService;
    /**
     * Initialize the Customer Survey SDK
     * @param config - Configuration options
     */
    constructor(config: SurveySDKConfig);
    private createClient;
    private buildHeaders;
    /**
     * Set authentication token
     */
    setAuthToken(token: string): void;
    /**
     * Clear authentication token
     */
    clearAuthToken(): void;
    /**
     * Set API key
     */
    setApiKey(apiKey: string): void;
    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled: boolean): void;
    /**
     * Refresh the API client with updated configuration
     */
    private refreshClient;
    /**
     * Log debug information if debug mode is enabled
     */
    private logDebug;
    /**
     * Make API request
     * Internal method used by services
     */
    request<T = any>(method: string, path: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
}
/**
 * Survey Service - manages survey operations
 */
declare class SurveyService {
    private sdk;
    constructor(sdk: CustomerSurveySDK);
    /**
     * Get all surveys
     */
    getSurveys(params?: Record<string, any>): Promise<AxiosResponse>;
    /**
     * Get survey by ID
     */
    getSurvey(id: string): Promise<AxiosResponse>;
    /**
     * Create a new survey
     */
    createSurvey(survey: any): Promise<AxiosResponse>;
    /**
     * Update an existing survey
     */
    updateSurvey(id: string, survey: any): Promise<AxiosResponse>;
    /**
     * Delete a survey
     */
    deleteSurvey(id: string): Promise<AxiosResponse>;
    /**
     * Get a public survey (no authentication required)
     */
    getPublicSurvey(id: string): Promise<AxiosResponse>;
}
/**
 * Response Service - manages survey responses
 */
declare class ResponseService {
    private sdk;
    constructor(sdk: CustomerSurveySDK);
    /**
     * Get all responses
     */
    getResponses(params?: Record<string, any>): Promise<AxiosResponse>;
    /**
     * Get response by ID
     */
    getResponse(id: string): Promise<AxiosResponse>;
    /**
     * Submit a new response
     */
    submitResponse(response: any): Promise<AxiosResponse>;
    /**
     * Delete a response
     */
    deleteResponse(id: string): Promise<AxiosResponse>;
    /**
     * Get response statistics for a survey
     */
    getResponseStats(surveyId: string): Promise<AxiosResponse>;
}
/**
 * AI Service - manages AI features
 */
declare class AIService {
    private sdk;
    constructor(sdk: CustomerSurveySDK);
    /**
     * Analyze text using NLP
     */
    analyzeText(text: string): Promise<AxiosResponse>;
    /**
     * Get insights from survey responses
     */
    getInsights(responses: any[]): Promise<AxiosResponse>;
    /**
     * Get survey recommendation based on goal
     */
    recommendSurvey(goal: string, industry?: string): Promise<AxiosResponse>;
}
export default CustomerSurveySDK;
