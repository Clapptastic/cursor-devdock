import { ApiError, ApiResponse, RequestOptions } from '../models/types';

/**
 * Base API client for making HTTP requests to services
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private debugEnabled: boolean;

  /**
   * Initialize the API client
   * @param baseUrl - Base URL for the service
   * @param defaultTimeout - Default timeout for requests in ms
   */
  constructor(baseUrl: string, defaultTimeout = 10000) {
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
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear the authorization token
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Make a GET request to the API
   * @param path - API endpoint path
   * @param options - Request options
   * @returns Promise with the response data
   */
  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  /**
   * Make a POST request to the API
   * @param path - API endpoint path
   * @param data - Data to send in the request body
   * @param options - Request options
   * @returns Promise with the response data
   */
  async post<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }

  /**
   * Make a PUT request to the API
   * @param path - API endpoint path
   * @param data - Data to send in the request body
   * @param options - Request options
   * @returns Promise with the response data
   */
  async put<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }

  /**
   * Make a DELETE request to the API
   * @param path - API endpoint path
   * @param options - Request options
   * @returns Promise with the response data
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(message: string, ...args: any[]): void {
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
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
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
      let responseData: any;
      
      if (responseType === 'json') {
        responseData = await response.json();
      } else if (responseType === 'blob') {
        responseData = await response.blob();
      } else if (responseType === 'text') {
        responseData = await response.text();
      }
      
      this.log(`Response: ${response.status}`, responseData);
      
      if (!response.ok) {
        const error: ApiError = {
          code: responseData.code || 'UNKNOWN_ERROR',
          message: responseData.message || 'Unknown error occurred',
          status: response.status,
          details: responseData.details,
        };
        throw error;
      }
      
      return responseData as ApiResponse<T>;
    } catch (error) {
      this.log('Request error:', error);
      
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw {
          code: 'REQUEST_TIMEOUT',
          message: `Request timeout after ${timeout}ms`,
          status: 408,
        } as ApiError;
      }
      
      if ((error as ApiError).code) {
        throw error;
      }
      
      throw {
        code: 'NETWORK_ERROR',
        message: (error as Error).message || 'Network error occurred',
        status: 0,
      } as ApiError;
    }
  }
} 