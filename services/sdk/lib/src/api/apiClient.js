"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
/**
 * Base API client for making HTTP requests to services
 */
class ApiClient {
    /**
     * Initialize the API client
     * @param baseUrl - Base URL for the service
     * @param defaultTimeout - Default timeout for requests in ms
     */
    constructor(baseUrl, defaultTimeout = 10000) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        this.defaultTimeout = defaultTimeout;
        this.debugEnabled = false;
    }
    /**
     * Set an authorization token for requests
     * @param token - The authentication token
     */
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    /**
     * Clear the authorization token
     */
    clearAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }
    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled) {
        this.debugEnabled = enabled;
    }
    /**
     * Make a GET request to the API
     * @param path - API endpoint path
     * @param options - Request options
     * @returns Promise with the response data
     */
    async get(path, options) {
        return this.request('GET', path, undefined, options);
    }
    /**
     * Make a POST request to the API
     * @param path - API endpoint path
     * @param data - Data to send in the request body
     * @param options - Request options
     * @returns Promise with the response data
     */
    async post(path, data, options) {
        return this.request('POST', path, data, options);
    }
    /**
     * Make a PUT request to the API
     * @param path - API endpoint path
     * @param data - Data to send in the request body
     * @param options - Request options
     * @returns Promise with the response data
     */
    async put(path, data, options) {
        return this.request('PUT', path, data, options);
    }
    /**
     * Make a DELETE request to the API
     * @param path - API endpoint path
     * @param options - Request options
     * @returns Promise with the response data
     */
    async delete(path, options) {
        return this.request('DELETE', path, undefined, options);
    }
    /**
     * Log debug messages if debug mode is enabled
     */
    log(message, ...args) {
        if (this.debugEnabled) {
            console.debug(`[ApiClient] ${message}`, ...args);
        }
    }
    /**
     * Make an HTTP request to the API
     * @param method - HTTP method
     * @param path - API endpoint path
     * @param data - Data to send in the request body
     * @param options - Request options
     * @returns Promise with the response data
     */
    async request(method, path, data, options) {
        const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        const headers = { ...this.defaultHeaders, ...(options?.headers || {}) };
        const timeout = options?.timeout || this.defaultTimeout;
        this.log(`${method} ${url}`, { data, headers });
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
                signal: AbortSignal.timeout(timeout)
            });
            const responseType = options?.responseType || 'json';
            let responseData;
            if (responseType === 'json') {
                responseData = await response.json();
            }
            else if (responseType === 'blob') {
                responseData = await response.blob();
            }
            else if (responseType === 'text') {
                responseData = await response.text();
            }
            this.log(`Response: ${response.status}`, responseData);
            if (!response.ok) {
                const error = {
                    code: responseData.code || 'UNKNOWN_ERROR',
                    message: responseData.message || 'Unknown error occurred',
                    status: response.status,
                    details: responseData.details,
                };
                throw error;
            }
            return responseData;
        }
        catch (error) {
            this.log('Request error:', error);
            if (error instanceof DOMException && error.name === 'TimeoutError') {
                throw {
                    code: 'REQUEST_TIMEOUT',
                    message: `Request timeout after ${timeout}ms`,
                    status: 408,
                };
            }
            if (error.code) {
                throw error;
            }
            throw {
                code: 'NETWORK_ERROR',
                message: error.message || 'Network error occurred',
                status: 0,
            };
        }
    }
}
exports.ApiClient = ApiClient;
