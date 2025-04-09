import { ApiResponse, RequestOptions } from '../models/types';
/**
 * Base API client for making HTTP requests to services
 */
export declare class ApiClient {
    private baseUrl;
    private defaultHeaders;
    private defaultTimeout;
    private debugEnabled;
    /**
     * Initialize the API client
     * @param baseUrl - Base URL for the service
     * @param defaultTimeout - Default timeout for requests in ms
     */
    constructor(baseUrl: string, defaultTimeout?: number);
    /**
     * Set an authorization token for requests
     * @param token - The authentication token
     */
    setAuthToken(token: string): void;
    /**
     * Clear the authorization token
     */
    clearAuthToken(): void;
    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled: boolean): void;
    /**
     * Make a GET request to the API
     * @param path - API endpoint path
     * @param options - Request options
     * @returns Promise with the response data
     */
    get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
    /**
     * Make a POST request to the API
     * @param path - API endpoint path
     * @param data - Data to send in the request body
     * @param options - Request options
     * @returns Promise with the response data
     */
    post<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
    /**
     * Make a PUT request to the API
     * @param path - API endpoint path
     * @param data - Data to send in the request body
     * @param options - Request options
     * @returns Promise with the response data
     */
    put<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
    /**
     * Make a DELETE request to the API
     * @param path - API endpoint path
     * @param options - Request options
     * @returns Promise with the response data
     */
    delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
    /**
     * Log debug messages if debug mode is enabled
     */
    private log;
    /**
     * Make an HTTP request to the API
     * @param method - HTTP method
     * @param path - API endpoint path
     * @param data - Data to send in the request body
     * @param options - Request options
     * @returns Promise with the response data
     */
    private request;
}
