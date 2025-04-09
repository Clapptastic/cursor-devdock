/**
 * API Client
 * Base client for making API requests to the Customer Survey Platform
 */
import { AxiosRequestConfig } from 'axios';
import { SdkConfig } from '../models/types';
export declare class ApiClient {
    private client;
    private logger;
    private config;
    constructor(config: SdkConfig);
    /**
     * Get default headers for API requests
     */
    private getDefaultHeaders;
    /**
     * Redact sensitive header values for logging
     */
    private redactSensitiveHeaders;
    /**
     * Handle API errors and convert to a consistent format
     */
    private handleApiError;
    /**
     * Make a GET request to the API
     * @param path - API endpoint path
     * @param params - Query parameters
     * @param config - Additional request configuration
     */
    get<T>(path: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a POST request to the API
     * @param path - API endpoint path
     * @param data - Request body data
     * @param config - Additional request configuration
     */
    post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PUT request to the API
     * @param path - API endpoint path
     * @param data - Request body data
     * @param config - Additional request configuration
     */
    put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a DELETE request to the API
     * @param path - API endpoint path
     * @param config - Additional request configuration
     */
    delete<T>(path: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Update API token
     * @param token - The new JWT token
     */
    setToken(token: string): void;
    /**
     * Update API key
     * @param apiKey - The new API key
     */
    setApiKey(apiKey: string): void;
}
