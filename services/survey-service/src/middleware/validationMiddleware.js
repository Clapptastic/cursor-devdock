/**
 * Validation Middleware
 * 
 * Uses Joi schemas to validate incoming requests
 */

const logger = require('../utils/logger');

/**
 * Middleware factory for validating requests with Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Request property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.debug(`Validation error: ${JSON.stringify(errors)}`);
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    // Replace req[source] with validated data
    req[source] = value;
    next();
  };
};

module.exports = validate; 