"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Logger utility for SDK debugging
 */
class Logger {
    /**
     * Create a new logger
     * @param debugEnabled Whether debug logging is enabled
     */
    constructor(debugEnabled = false) {
        this.debugEnabled = debugEnabled;
    }
    /**
     * Log debug message if debug mode is enabled
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    debug(message, data) {
        if (this.debugEnabled) {
            if (data) {
                console.debug(`[CustomerSurveySDK] ${message}`, data);
            }
            else {
                console.debug(`[CustomerSurveySDK] ${message}`);
            }
        }
    }
    /**
     * Log info message
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    info(message, data) {
        if (data) {
            console.info(`[CustomerSurveySDK] ${message}`, data);
        }
        else {
            console.info(`[CustomerSurveySDK] ${message}`);
        }
    }
    /**
     * Log warning message
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    warn(message, data) {
        if (data) {
            console.warn(`[CustomerSurveySDK] ${message}`, data);
        }
        else {
            console.warn(`[CustomerSurveySDK] ${message}`);
        }
    }
    /**
     * Log error message
     * @param message The message to log
     * @param error Optional error to include in the log
     */
    error(message, error) {
        if (error) {
            console.error(`[CustomerSurveySDK] ${message}`, error);
        }
        else {
            console.error(`[CustomerSurveySDK] ${message}`);
        }
    }
    /**
     * Set debug mode
     * @param enabled Whether debug mode is enabled
     */
    setDebugMode(enabled) {
        this.debugEnabled = enabled;
    }
}
exports.Logger = Logger;
