/**
 * Validation Middleware
 * 
 * Provides request validation using Joi schemas
 */

const logger = require('../utils/logger');

/**
 * Creates a validation middleware using the provided Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        const errorMessage = `Validation error: ${error.details.map(x => x.message).join(', ')}`;
        logger.debug(errorMessage);
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors
        });
      }
      
      // Replace request data with validated data
      req[property] = value;
      next();
    } catch (error) {
      logger.error(`Validation middleware error: ${error.message}`);
      next(error);
    }
  };
};

module.exports = validate; 