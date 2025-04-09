/**
 * Logger Utility
 * Provides consistent logging throughout the AI service
 */

const winston = require('winston');
const { format } = winston;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Determine appropriate log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'http';
};

// Define log format for readability
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create console transport with colored output
const consoleFormat = format.combine(
  format.colorize(),
  format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    return `[${timestamp}] ${level}: ${message} ${
      Object.keys(meta).length && meta.stack !== undefined 
        ? '\n' + meta.stack 
        : Object.keys(meta).length 
          ? '\n' + JSON.stringify(meta, null, 2) 
          : ''
    }`;
  })
);

// Initialize the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  );
  
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Stream for Morgan integration
logger.stream = {
  write: message => logger.http(message.trim())
};

// Helper for redacting sensitive information
logger.redact = (obj, fieldsToRedact = ['password', 'token', 'secret', 'apiKey']) => {
  if (!obj) return obj;
  const copyObj = { ...obj };
  
  fieldsToRedact.forEach(field => {
    if (field in copyObj) {
      copyObj[field] = '[REDACTED]';
    }
  });
  
  return copyObj;
};

module.exports = logger; 