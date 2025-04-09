/**
 * Custom error class for Customer Survey SDK
 */
export declare class CustomerSurveyError extends Error {
    /**
     * HTTP status code (if applicable)
     */
    status?: number;
    /**
     * Error code
     */
    code: string;
    /**
     * Additional error details
     */
    details?: Record<string, any>;
    /**
     * Create a new CustomerSurveyError
     * @param message Error message
     * @param code Error code
     * @param status HTTP status code (if applicable)
     * @param details Additional error details
     */
    constructor(message: string, code?: string, status?: number, details?: Record<string, any>);
    /**
     * Create an error from an API response
     * @param error API error response
     * @returns CustomerSurveyError instance
     */
    static fromApiError(error: any): CustomerSurveyError;
    /**
     * Create a validation error
     * @param message Validation error message
     * @param details Validation error details
     * @returns CustomerSurveyError instance
     */
    static validation(message: string, details?: Record<string, any>): CustomerSurveyError;
    /**
     * Create an authentication error
     * @param message Authentication error message
     * @returns CustomerSurveyError instance
     */
    static authentication(message?: string): CustomerSurveyError;
    /**
     * Create a not found error
     * @param resource Resource type
     * @param id Resource identifier
     * @returns CustomerSurveyError instance
     */
    static notFound(resource: string, id?: string | number): CustomerSurveyError;
}
