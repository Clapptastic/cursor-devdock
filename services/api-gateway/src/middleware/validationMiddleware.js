/**
 * Validation Middleware
 * Uses Joi schemas to validate incoming requests
 */

const logger = require('../utils/logger');

/**
 * Creates a validation middleware using the provided Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: property === 'headers' // Allow unknown fields in headers
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
        type: detail.type
      }));

      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors: errorDetails,
        body: property === 'body' ? req.body : undefined,
        params: property === 'params' ? req.params : undefined,
        query: property === 'query' ? req.query : undefined
      });

      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: {
          message: 'Validation failed',
          details: errorDetails
        }
      });
    }

    // Replace the validated object with the sanitized value
    req[property] = value;
    return next();
  };
};

module.exports = validate; 