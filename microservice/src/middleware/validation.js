/**
 * Request validation middleware
 * Uses Joi to validate request bodies and parameters
 */
const Joi = require('joi');
const asyncHandler = require('./asyncHandler');

/**
 * Format Joi validation errors into a standardized structure
 * @param {Object} error - Joi validation error object
 * @returns {Object} Formatted error object
 */
const formatValidationErrors = (error) => {
  return {
    success: false,
    message: 'Validation Error',
    errors: error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }))
  };
};

/**
 * Validate process data request body
 * @param {Object} data - Request body to validate
 * @returns {Object} Validation result with error and value properties
 */
const validateProcessData = (data) => {
  // Define the schema using Joi
  const schema = Joi.object({
    data: Joi.array().required().min(1).messages({
      'array.base': 'Data must be an array',
      'array.min': 'Data array must contain at least one item',
      'any.required': 'Data array is required'
    }),
    options: Joi.object({
      processingType: Joi.string().valid('basic', 'advanced', 'premium').default('basic'),
      calculateScores: Joi.boolean().default(true),
      includeMeta: Joi.boolean().default(false),
      tags: Joi.array().items(Joi.string()),
      userId: Joi.string().uuid(),
      surveyId: Joi.string().uuid(),
      normalize: Joi.boolean().default(false),
      compareWithPrevious: Joi.boolean().default(false),
      storageOptions: Joi.object({
        ttl: Joi.number().integer().min(0),
        priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
        compression: Joi.boolean().default(false)
      })
    }).default({})
  });

  // Validate the data
  return schema.validate(data, { abortEarly: false });
};

/**
 * Middleware to validate process data requests
 * @middleware
 */
const validateProcessRequest = asyncHandler(async (req, res, next) => {
  const { error, value } = validateProcessData(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  // Attach validated data to request object
  req.validatedData = value;
  next();
});

/**
 * Validate trends analysis request body
 * @param {Object} data - Request body to validate
 * @returns {Object} Validation result with error and value properties
 */
const validateTrendsData = (data) => {
  // Define the schema using Joi
  const schema = Joi.object({
    currentData: Joi.array().required().min(1).messages({
      'array.base': 'Current data must be an array',
      'array.min': 'Current data array must contain at least one item',
      'any.required': 'Current data array is required'
    }),
    previousData: Joi.array().required().min(1).messages({
      'array.base': 'Previous data must be an array',
      'array.min': 'Previous data array must contain at least one item',
      'any.required': 'Previous data array is required'
    }),
    options: Joi.object({
      processingType: Joi.string().valid('basic', 'advanced', 'premium').default('advanced'),
      calculateScores: Joi.boolean().default(true),
      includeMeta: Joi.boolean().default(false),
      normalize: Joi.boolean().default(true),
      timeframe: Joi.object({
        current: Joi.object({
          start: Joi.date().iso(),
          end: Joi.date().iso()
        }),
        previous: Joi.object({
          start: Joi.date().iso(),
          end: Joi.date().iso()
        })
      }),
      userId: Joi.string().uuid(),
      surveyId: Joi.string().uuid(),
      fieldMapping: Joi.object().pattern(
        Joi.string(), // Key pattern (can be any string)
        Joi.string()  // Value pattern (can be any string)
      )
    }).default({})
  });

  // Validate the data
  return schema.validate(data, { abortEarly: false });
};

/**
 * Middleware to validate trends analysis requests
 * @middleware
 */
const validateTrendsRequest = asyncHandler(async (req, res, next) => {
  const { error, value } = validateTrendsData(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  // Attach validated data to request object
  req.validatedData = value;
  next();
});

/**
 * Validate pagination parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} Validated pagination parameters
 */
const validatePagination = (query) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('created_at', 'status').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    status: Joi.string().valid('completed', 'processing', 'failed'),
    userId: Joi.string().uuid(),
    surveyId: Joi.string().uuid(),
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
    source: Joi.string(),
    type: Joi.string().valid(
      'sentiment-analysis', 
      'theme-analysis', 
      'insights-analysis', 
      'trends-analysis', 
      'next-steps-analysis',
      'heatmap-analysis'
    )
  });

  return schema.validate(query, { abortEarly: false });
};

/**
 * Middleware to validate pagination parameters
 * @middleware
 */
const validatePaginationParams = asyncHandler(async (req, res, next) => {
  const { error, value } = validatePagination(req.query);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  // Attach validated query params to request object
  req.validatedQuery = value;
  next();
});

module.exports = {
  validateProcessRequest,
  validateTrendsRequest,
  validatePaginationParams,
  formatValidationErrors
}; 