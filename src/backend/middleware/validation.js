/**
 * Validation middleware
 * Middleware functions for validating request data
 */
const {
  validateUser,
  validateSurvey,
  validateTemplate,
  validateResponse,
  validateAnalysis
} = require('../../database/validation');

/**
 * Format validation errors into a consistent response
 * @param {Object} error - Joi validation error
 * @returns {Object} Formatted error object
 */
const formatValidationErrors = (error) => {
  const errors = {};

  if (error.details) {
    error.details.forEach((detail) => {
      const path = detail.path.join('.');
      errors[path] = detail.message;
    });
  }

  return {
    message: 'Validation failed',
    errors
  };
};

/**
 * Middleware to validate user registration data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateRegistration = (req, res, next) => {
  const { error, value } = validateUser(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  // Additional registration-specific validation
  if (!req.body.password || req.body.password.length < 6) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: {
        password: 'Password must be at least 6 characters'
      }
    });
  }

  req.validatedData = value;
  next();
};

/**
 * Middleware to validate user login data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateLogin = (req, res, next) => {
  // Check for email and password
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: {
        email: !req.body.email ? 'Email is required' : undefined,
        password: !req.body.password ? 'Password is required' : undefined
      }
    });
  }

  next();
};

/**
 * Middleware to validate user update data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateUserUpdate = (req, res, next) => {
  // Only validate fields that are being updated
  const fieldsToValidate = {};
  
  ['name', 'email', 'company', 'password'].forEach(field => {
    if (req.body[field]) {
      fieldsToValidate[field] = req.body[field];
    }
  });

  // Skip validation if no fields to update
  if (Object.keys(fieldsToValidate).length === 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: {
        general: 'No valid fields to update'
      }
    });
  }

  // If password is being updated, check length
  if (fieldsToValidate.password && fieldsToValidate.password.length < 6) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: {
        password: 'Password must be at least 6 characters'
      }
    });
  }

  req.validatedData = fieldsToValidate;
  next();
};

/**
 * Middleware to validate user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateUserMiddleware = (req, res, next) => {
  const { error, value } = validateUser(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  req.validatedData = value;
  next();
};

/**
 * Middleware to validate survey data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateSurveyMiddleware = (req, res, next) => {
  const { error, value } = validateSurvey(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  req.validatedData = value;
  next();
};

/**
 * Middleware to validate template data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateTemplateMiddleware = (req, res, next) => {
  const { error, value } = validateTemplate(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  req.validatedData = value;
  next();
};

/**
 * Middleware to validate response data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateResponseMiddleware = (req, res, next) => {
  const { error, value } = validateResponse(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  req.validatedData = value;
  next();
};

/**
 * Middleware to validate analysis data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAnalysisMiddleware = (req, res, next) => {
  const { error, value } = validateAnalysis(req.body);

  if (error) {
    return res.status(400).json(formatValidationErrors(error));
  }

  req.validatedData = value;
  next();
};

module.exports = {
  validateUserMiddleware,
  validateSurveyMiddleware,
  validateTemplateMiddleware,
  validateResponseMiddleware,
  validateAnalysisMiddleware,
  validateRegistration,
  validateLogin,
  validateUserUpdate
}; 