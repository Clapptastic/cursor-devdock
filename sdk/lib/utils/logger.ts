/**
 * Logger utility for Cursor DevDock SDK
 */

import chalk from 'chalk';
import type { LogLevel } from '../types';

/**
 * Logger class that handles logging for the SDK
 */
export class Logger {
  private level: LogLevel;
  private logLevels: Record<LogLevel, number>;
  
  /**
   * Creates a new logger instance
   * @param level Log level to set
   */
  constructor(level: LogLevel = 'info') {
    this.level = level;
    
    // Define log level priorities
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4
    };
  }
  
  /**
   * Sets the log level
   * @param level Log level to set
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param optionalParams Additional parameters to log
   */
  debug(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('debug')) {
      this.logToConsole('debug', chalk.blue('[DEBUG]'), message, ...optionalParams);
    }
  }
  
  /**
   * Log an info message
   * @param message Message to log
   * @param optionalParams Additional parameters to log
   */
  info(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('info')) {
      this.logToConsole('info', chalk.green('[INFO]'), message, ...optionalParams);
    }
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   * @param optionalParams Additional parameters to log
   */
  warn(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('warn')) {
      this.logToConsole('warn', chalk.yellow('[WARN]'), message, ...optionalParams);
    }
  }
  
  /**
   * Log an error message
   * @param message Message to log
   * @param optionalParams Additional parameters to log
   */
  error(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('error')) {
      this.logToConsole('error', chalk.red('[ERROR]'), message, ...optionalParams);
    }
  }
  
  /**
   * Determines if the message should be logged based on the current log level
   * @param messageLevel Level of the message
   * @returns Whether the message should be logged
   * @private
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    return this.logLevels[messageLevel] >= this.logLevels[this.level];
  }
  
  /**
   * Logs a message to the console
   * @param method Console method to use
   * @param prefix Prefix for the message
   * @param message Message to log
   * @param optionalParams Additional parameters to log
   * @private
   */
  private logToConsole(
    method: 'debug' | 'info' | 'warn' | 'error',
    prefix: string,
    message: string,
    ...optionalParams: any[]
  ): void {
    const timestamp = new Date().toISOString();
    const formattedPrefix = `${chalk.gray(timestamp)} ${prefix} ${chalk.bold('[DevDock SDK]')}`;
    
    // If the message contains an Error object, handle it specially
    if (optionalParams.length === 1 && optionalParams[0] instanceof Error) {
      const error = optionalParams[0];
      console[method](formattedPrefix, message, chalk.red(error.message));
      if (error.stack) {
        console[method](chalk.gray(error.stack.split('\n').slice(1).join('\n')));
      }
    }
    // Handle regular logging
    else if (optionalParams.length === 0) {
      console[method](formattedPrefix, message);
    }
    // Handle logging with additional params
    else {
      console[method](formattedPrefix, message, ...optionalParams);
    }
  }
} 