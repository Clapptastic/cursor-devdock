"use strict";
/**
 * Customer Survey SDK
 * Main entry point for the Customer Survey Platform SDK
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSurveySDK = exports.CustomerSurveyError = void 0;
const logger_1 = require("./utils/logger");
const axios_1 = __importDefault(require("axios"));
__exportStar(require("./models/types"), exports);
class CustomerSurveyError extends Error {
    constructor(message, code, status) {
        super(message);
        this.name = 'CustomerSurveyError';
        this.code = code;
        this.status = status;
    }
}
exports.CustomerSurveyError = CustomerSurveyError;
/**
 * Main SDK class for interacting with the Customer Survey Platform
 */
class CustomerSurveySDK {
    /**
     * Initialize the Customer Survey SDK
     * @param config - Configuration options
     */
    constructor(config) {
        if (!config.apiUrl) {
            throw new Error('API URL is required');
        }
        this.config = {
            timeout: 30000,
            debug: false,
            ...config
        };
        this.logger = new logger_1.Logger(this.config.debug || false);
        this.client = this.createClient();
        // Initialize services
        this.survey = new SurveyService(this);
        this.response = new ResponseService(this);
        this.ai = new AIService(this);
        if (this.config.debug) {
            this.logDebug('SDK initialized with config:', this.config);
        }
    }
    createClient() {
        const client = axios_1.default.create({
            baseURL: this.config.apiUrl,
            timeout: this.config.timeout,
            headers: this.buildHeaders()
        });
        // Add response interceptor to handle errors
        client.interceptors.response.use((response) => response, (error) => {
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
        });
        return client;
    }
    buildHeaders() {
        const headers = {
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
    setAuthToken(token) {
        this.config.token = token;
        this.refreshClient();
    }
    /**
     * Clear authentication token
     */
    clearAuthToken() {
        delete this.config.token;
        this.refreshClient();
    }
    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.refreshClient();
    }
    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled) {
        this.config.debug = enabled;
    }
    /**
     * Refresh the API client with updated configuration
     */
    refreshClient() {
        this.client = this.createClient();
    }
    /**
     * Log debug information if debug mode is enabled
     */
    logDebug(...args) {
        if (this.config.debug) {
            console.debug('[CustomerSurveySDK]', ...args);
        }
    }
    /**
     * Make API request
     * Internal method used by services
     */
    async request(method, path, data, config) {
        if (this.config.debug) {
            this.logDebug(`${method.toUpperCase()} ${path}`, data || '');
        }
        try {
            const response = await this.client.request({
                method,
                url: path,
                data,
                ...config
            });
            if (this.config.debug) {
                this.logDebug(`Response:`, response.status, response.data);
            }
            return response;
        }
        catch (error) {
            if (this.config.debug) {
                this.logDebug(`Request Error:`, error);
            }
            // Handle axios errors
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with an error status
                    const { data, status } = error.response;
                    return Promise.reject({
                        code: data.code || 'API_ERROR',
                        message: data.message || 'An error occurred with the API request',
                        status,
                        data
                    });
                }
                else if (error.request) {
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
exports.CustomerSurveySDK = CustomerSurveySDK;
/**
 * Survey Service - manages survey operations
 */
class SurveyService {
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Get all surveys
     */
    async getSurveys(params) {
        return this.sdk.request('get', '/surveys', null, { params });
    }
    /**
     * Get survey by ID
     */
    async getSurvey(id) {
        return this.sdk.request('get', `/surveys/${id}`);
    }
    /**
     * Create a new survey
     */
    async createSurvey(survey) {
        return this.sdk.request('post', '/surveys', survey);
    }
    /**
     * Update an existing survey
     */
    async updateSurvey(id, survey) {
        return this.sdk.request('put', `/surveys/${id}`, survey);
    }
    /**
     * Delete a survey
     */
    async deleteSurvey(id) {
        return this.sdk.request('delete', `/surveys/${id}`);
    }
    /**
     * Get a public survey (no authentication required)
     */
    async getPublicSurvey(id) {
        return this.sdk.request('get', `/public/survey/${id}`);
    }
}
/**
 * Response Service - manages survey responses
 */
class ResponseService {
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Get all responses
     */
    async getResponses(params) {
        return this.sdk.request('get', '/responses', null, { params });
    }
    /**
     * Get response by ID
     */
    async getResponse(id) {
        return this.sdk.request('get', `/responses/${id}`);
    }
    /**
     * Submit a new response
     */
    async submitResponse(response) {
        return this.sdk.request('post', '/responses', response);
    }
    /**
     * Delete a response
     */
    async deleteResponse(id) {
        return this.sdk.request('delete', `/responses/${id}`);
    }
    /**
     * Get response statistics for a survey
     */
    async getResponseStats(surveyId) {
        return this.sdk.request('get', `/responses/stats/${surveyId}`);
    }
}
/**
 * AI Service - manages AI features
 */
class AIService {
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Analyze text using NLP
     */
    async analyzeText(text) {
        return this.sdk.request('post', '/ai/analyze/text', { text });
    }
    /**
     * Get insights from survey responses
     */
    async getInsights(responses) {
        return this.sdk.request('post', '/ai/insights', { responses });
    }
    /**
     * Get survey recommendation based on goal
     */
    async recommendSurvey(goal, industry) {
        return this.sdk.request('post', '/ai/recommend/survey', { goal, industry });
    }
}
exports.default = CustomerSurveySDK;
