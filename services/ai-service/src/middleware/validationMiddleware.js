/**
 * Validation Middleware
 * Validates request data against defined schemas
 */

const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Creates a middleware that validates request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    // Validate against schema
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: property === 'headers' // Allow unknown fields in headers
    });

    if (error) {
      // Format validation errors
      const details = error.details.map(detail => ({
        path: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      // Log validation errors
      logger.warn('Request validation failed', {
        path: req.originalUrl,
        method: req.method,
        validationErrors: details,
        data: logger.redact(req[property])
      });

      // Create error response
      const validationError = new ValidationError('Request validation failed');
      validationError.setDetails(details);
      
      return next(validationError);
    }

    // Replace request data with validated data
    req[property] = value;
    return next();
  };
};

module.exports = validate; 