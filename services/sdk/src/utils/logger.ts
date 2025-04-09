/**
 * Logger utility for SDK debugging
 */
export class Logger {
  private debugEnabled: boolean;

  /**
   * Create a new logger
   * @param debugEnabled Whether debug logging is enabled
   */
  constructor(debugEnabled: boolean = false) {
    this.debugEnabled = debugEnabled;
  }

  /**
   * Log debug message if debug mode is enabled
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public debug(message: string, data?: any): void {
    if (this.debugEnabled) {
      if (data) {
        console.debug(`[CustomerSurveySDK] ${message}`, data);
      } else {
        console.debug(`[CustomerSurveySDK] ${message}`);
      }
    }
  }

  /**
   * Log info message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public info(message: string, data?: any): void {
    if (data) {
      console.info(`[CustomerSurveySDK] ${message}`, data);
    } else {
      console.info(`[CustomerSurveySDK] ${message}`);
    }
  }

  /**
   * Log warning message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public warn(message: string, data?: any): void {
    if (data) {
      console.warn(`[CustomerSurveySDK] ${message}`, data);
    } else {
      console.warn(`[CustomerSurveySDK] ${message}`);
    }
  }

  /**
   * Log error message
   * @param message The message to log
   * @param error Optional error to include in the log
   */
  public error(message: string, error?: any): void {
    if (error) {
      console.error(`[CustomerSurveySDK] ${message}`, error);
    } else {
      console.error(`[CustomerSurveySDK] ${message}`);
    }
  }

  /**
   * Set debug mode
   * @param enabled Whether debug mode is enabled
   */
  public setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }
} 