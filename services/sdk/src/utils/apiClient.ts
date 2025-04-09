/**
 * API Client
 * Base client for making API requests to the Customer Survey Platform
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SdkConfig, ApiError } from '../models/types';
import { Logger } from './logger';

export class ApiClient {
  private client: AxiosInstance;
  private logger: Logger;
  private config: SdkConfig;

  constructor(config: SdkConfig) {
    this.config = config;
    this.logger = new Logger(config.debug || false);
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: this.getDefaultHeaders()
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(request => {
      this.logger.debug('API Request:', {
        method: request.method?.toUpperCase(),
        url: request.url,
        headers: this.redactSensitiveHeaders(request.headers),
        params: request.params,
        data: request.data
      });
      return request;
    });

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      response => {
        this.logger.debug('API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        });
        return response;
      },
      error => {
        const errorResponse = this.handleApiError(error);
        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * Get default headers for API requests
   */
  private getDefaultHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'CustomerSurveySDK/1.0.0',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  /**
   * Redact sensitive header values for logging
   */
  private redactSensitiveHeaders(headers: any) {
    const redactedHeaders = {...headers};
    if (redactedHeaders['Authorization']) {
      redactedHeaders['Authorization'] = 'Bearer [REDACTED]';
    }
    if (redactedHeaders['X-API-Key']) {
      redactedHeaders['X-API-Key'] = '[REDACTED]';
    }
    return redactedHeaders;
  }

  /**
   * Handle API errors and convert to a consistent format
   */
  private handleApiError(error: any): ApiError {
    this.logger.error('API Error:', error);
    
    // Format the error response
    const errorResponse: ApiError = {
      status: error.response?.status || 500,
      message: 'An error occurred while making the API request',
      code: 'API_ERROR',
      details: error.response?.data || error.message
    };

    // Extract more detailed information if available
    if (error.response) {
      errorResponse.message = error.response.data?.message || errorResponse.message;
      errorResponse.code = error.response.data?.code || errorResponse.code;
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.message = 'No response received from the API';
      errorResponse.code = 'API_NO_RESPONSE';
    }

    return errorResponse;
  }

  /**
   * Make a GET request to the API
   * @param path - API endpoint path
   * @param params - Query parameters
   * @param config - Additional request configuration
   */
  public async get<T>(path: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(path, {
        ...config,
        params
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a POST request to the API
   * @param path - API endpoint path
   * @param data - Request body data
   * @param config - Additional request configuration
   */
  public async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(path, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PUT request to the API
   * @param path - API endpoint path
   * @param data - Request body data
   * @param config - Additional request configuration
   */
  public async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(path, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a DELETE request to the API
   * @param path - API endpoint path
   * @param config - Additional request configuration
   */
  public async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(path, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update API token
   * @param token - The new JWT token
   */
  public setToken(token: string): void {
    this.config.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Update API key
   * @param apiKey - The new API key
   */
  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
  }
} 