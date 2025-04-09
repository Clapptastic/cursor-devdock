"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSurveyError = void 0;
/**
 * Custom error class for Customer Survey SDK
 */
class CustomerSurveyError extends Error {
    /**
     * Create a new CustomerSurveyError
     * @param message Error message
     * @param code Error code
     * @param status HTTP status code (if applicable)
     * @param details Additional error details
     */
    constructor(message, code = 'UNKNOWN_ERROR', status, details) {
        super(message);
        this.name = 'CustomerSurveyError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
    /**
     * Create an error from an API response
     * @param error API error response
     * @returns CustomerSurveyError instance
     */
    static fromApiError(error) {
        // Handle Axios errors
        if (error.isAxiosError) {
            const status = error.response?.status;
            const data = error.response?.data;
            // Use response data if available, otherwise use generic message
            const message = data?.message || error.message || 'API request failed';
            const code = data?.code || `HTTP_${status}` || 'API_ERROR';
            return new CustomerSurveyError(message, code, status, data);
        }
        // Return a wrapped version of other errors
        return new CustomerSurveyError(error.message || 'Unknown error occurred', error.code || 'UNKNOWN_ERROR', error.status, error.details);
    }
    /**
     * Create a validation error
     * @param message Validation error message
     * @param details Validation error details
     * @returns CustomerSurveyError instance
     */
    static validation(message, details) {
        return new CustomerSurveyError(message, 'VALIDATION_ERROR', 400, details);
    }
    /**
     * Create an authentication error
     * @param message Authentication error message
     * @returns CustomerSurveyError instance
     */
    static authentication(message = 'Authentication failed') {
        return new CustomerSurveyError(message, 'AUTHENTICATION_ERROR', 401);
    }
    /**
     * Create a not found error
     * @param resource Resource type
     * @param id Resource identifier
     * @returns CustomerSurveyError instance
     */
    static notFound(resource, id) {
        const message = id
            ? `${resource} with ID ${id} not found`
            : `${resource} not found`;
        return new CustomerSurveyError(message, 'NOT_FOUND_ERROR', 404);
    }
}
exports.CustomerSurveyError = CustomerSurveyError;
