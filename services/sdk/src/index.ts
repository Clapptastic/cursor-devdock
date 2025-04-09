/**
 * Customer Survey SDK
 * Main entry point for the Customer Survey Platform SDK
 */

import { SdkConfig } from './models/types';
import { SurveyApi } from './api/surveyApi';
import { ResponseApi } from './api/responseApi';
import { AiApi } from './api/aiApi';
import { Logger } from './utils/logger';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export * from './models/types';

export interface SurveySDKConfig {
  apiUrl: string;
  token?: string;
  apiKey?: string;
  timeout?: number;
  debug?: boolean;
}

export class CustomerSurveyError extends Error {
  code: string;
  status: number;
  
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'CustomerSurveyError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Main SDK class for interacting with the Customer Survey Platform
 */
export class CustomerSurveySDK {
  private config: SurveySDKConfig;
  private logger: Logger;
  private client: AxiosInstance;

  /** API client for survey operations */
  public survey: SurveyService;
  
  /** API client for response operations */
  public response: ResponseService;
  
  /** API client for AI operations */
  public ai: AIService;

  /**
   * Initialize the Customer Survey SDK
   * @param config - Configuration options
   */
  constructor(config: SurveySDKConfig) {
    if (!config.apiUrl) {
      throw new Error('API URL is required');
    }

    this.config = {
      timeout: 30000,
      debug: false,
      ...config
    };

    this.logger = new Logger(this.config.debug || false);
    
    this.client = this.createClient();
    
    // Initialize services
    this.survey = new SurveyService(this);
    this.response = new ResponseService(this);
    this.ai = new AIService(this);
    
    if (this.config.debug) {
      this.logDebug('SDK initialized with config:', this.config);
    }
  }

  private createClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: this.buildHeaders()
    });

    // Add response interceptor to handle errors
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { data, status } = error.response;
          const code = data.code || 'API_ERROR';
          const message = data.message || 'An error occurred with the API request';
          
          if (this.config.debug) {
            this.logDebug(`API Error: ${status} ${code} - ${message}`);
          }
          
          return Promise.reject({
            code,
            message,
            status,
            data: data
          });
        }
        
        if (this.config.debug) {
          this.logDebug('Network Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );

    return client;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    return headers;
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.config.token = token;
    this.refreshClient();
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    delete this.config.token;
    this.refreshClient();
  }

  /**
   * Set API key
   */
  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.refreshClient();
  }

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.config.debug = enabled;
  }

  /**
   * Refresh the API client with updated configuration
   */
  private refreshClient(): void {
    this.client = this.createClient();
  }

  /**
   * Log debug information if debug mode is enabled
   */
  private logDebug(...args: any[]): void {
    if (this.config.debug) {
      console.debug('[CustomerSurveySDK]', ...args);
    }
  }

  /**
   * Make API request
   * Internal method used by services
   */
  public async request<T = any>(
    method: string,
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (this.config.debug) {
      this.logDebug(`${method.toUpperCase()} ${path}`, data || '');
    }

    try {
      const response = await this.client.request<T>({
        method,
        url: path,
        data,
        ...config
      });

      if (this.config.debug) {
        this.logDebug(`Response:`, response.status, response.data);
      }

      return response;
    } catch (error: any) {
      if (this.config.debug) {
        this.logDebug(`Request Error:`, error);
      }
      
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error status
          const { data, status } = error.response;
          return Promise.reject({
            code: data.code || 'API_ERROR',
            message: data.message || 'An error occurred with the API request',
            status,
            data
          });
        } else if (error.request) {
          // Request was made but no response received
          return Promise.reject({
            code: 'NETWORK_ERROR',
            message: 'Network error: no response received',
            status: 0
          });
        } 
      }
      
      // For any other error type
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
        status: 0
      });
    }
  }
}

/**
 * Survey Service - manages survey operations
 */
class SurveyService {
  private sdk: CustomerSurveySDK;

  constructor(sdk: CustomerSurveySDK) {
    this.sdk = sdk;
  }

  /**
   * Get all surveys
   */
  public async getSurveys(params?: Record<string, any>): Promise<AxiosResponse> {
    return this.sdk.request('get', '/surveys', null, { params });
  }

  /**
   * Get survey by ID
   */
  public async getSurvey(id: string): Promise<AxiosResponse> {
    return this.sdk.request('get', `/surveys/${id}`);
  }

  /**
   * Create a new survey
   */
  public async createSurvey(survey: any): Promise<AxiosResponse> {
    return this.sdk.request('post', '/surveys', survey);
  }

  /**
   * Update an existing survey
   */
  public async updateSurvey(id: string, survey: any): Promise<AxiosResponse> {
    return this.sdk.request('put', `/surveys/${id}`, survey);
  }

  /**
   * Delete a survey
   */
  public async deleteSurvey(id: string): Promise<AxiosResponse> {
    return this.sdk.request('delete', `/surveys/${id}`);
  }

  /**
   * Get a public survey (no authentication required)
   */
  public async getPublicSurvey(id: string): Promise<AxiosResponse> {
    return this.sdk.request('get', `/public/survey/${id}`);
  }
}

/**
 * Response Service - manages survey responses
 */
class ResponseService {
  private sdk: CustomerSurveySDK;

  constructor(sdk: CustomerSurveySDK) {
    this.sdk = sdk;
  }

  /**
   * Get all responses
   */
  public async getResponses(params?: Record<string, any>): Promise<AxiosResponse> {
    return this.sdk.request('get', '/responses', null, { params });
  }

  /**
   * Get response by ID
   */
  public async getResponse(id: string): Promise<AxiosResponse> {
    return this.sdk.request('get', `/responses/${id}`);
  }

  /**
   * Submit a new response
   */
  public async submitResponse(response: any): Promise<AxiosResponse> {
    return this.sdk.request('post', '/responses', response);
  }

  /**
   * Delete a response
   */
  public async deleteResponse(id: string): Promise<AxiosResponse> {
    return this.sdk.request('delete', `/responses/${id}`);
  }

  /**
   * Get response statistics for a survey
   */
  public async getResponseStats(surveyId: string): Promise<AxiosResponse> {
    return this.sdk.request('get', `/responses/stats/${surveyId}`);
  }
}

/**
 * AI Service - manages AI features
 */
class AIService {
  private sdk: CustomerSurveySDK;

  constructor(sdk: CustomerSurveySDK) {
    this.sdk = sdk;
  }

  /**
   * Analyze text using NLP
   */
  public async analyzeText(text: string): Promise<AxiosResponse> {
    return this.sdk.request('post', '/ai/analyze/text', { text });
  }

  /**
   * Get insights from survey responses
   */
  public async getInsights(responses: any[]): Promise<AxiosResponse> {
    return this.sdk.request('post', '/ai/insights', { responses });
  }

  /**
   * Get survey recommendation based on goal
   */
  public async recommendSurvey(goal: string, industry?: string): Promise<AxiosResponse> {
    return this.sdk.request('post', '/ai/recommend/survey', { goal, industry });
  }
}

export default CustomerSurveySDK; 