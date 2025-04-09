/**
 * Logger utility for SDK debugging
 */
export declare class Logger {
    private debugEnabled;
    /**
     * Create a new logger
     * @param debugEnabled Whether debug logging is enabled
     */
    constructor(debugEnabled?: boolean);
    /**
     * Log debug message if debug mode is enabled
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    debug(message: string, data?: any): void;
    /**
     * Log info message
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    info(message: string, data?: any): void;
    /**
     * Log warning message
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    warn(message: string, data?: any): void;
    /**
     * Log error message
     * @param message The message to log
     * @param error Optional error to include in the log
     */
    error(message: string, error?: any): void;
    /**
     * Set debug mode
     * @param enabled Whether debug mode is enabled
     */
    setDebugMode(enabled: boolean): void;
}
