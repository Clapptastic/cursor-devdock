/**
 * Database validation utilities
 * Provides functions to validate data before saving to database
 */
const Joi = require('joi');

/**
 * User validation schema
 */
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  company: Joi.string().allow('', null),
  role: Joi.string().valid('user', 'admin').default('user')
});

/**
 * Survey question validation schema
 */
const questionSchema = Joi.object({
  text: Joi.string().required(),
  type: Joi.string().valid('text', 'multiplechoice', 'checkbox', 'rating', 'boolean').required(),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.string()).when('type', {
    is: Joi.string().valid('multiplechoice', 'checkbox', 'rating'),
    then: Joi.array().min(1).required(),
    otherwise: Joi.array().default([])
  }),
  branchingLogic: Joi.object().allow(null)
});

/**
 * Survey validation schema
 */
const surveySchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).allow('', null),
  questions: Joi.array().items(questionSchema).min(1).required(),
  createdBy: Joi.string().required(),
  status: Joi.string().valid('draft', 'active', 'closed').default('draft'),
  responseCount: Joi.number().default(0),
  isTemplate: Joi.boolean().default(false),
  aiGenerated: Joi.boolean().default(false),
  businessContext: Joi.string().max(1000).allow('', null),
  targetAudience: Joi.string().max(500).allow('', null),
  customStyles: Joi.object().allow(null)
});

/**
 * Template validation schema
 */
const templateSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).allow('', null),
  category: Joi.string().required(),
  questions: Joi.array().items(questionSchema).min(1).required(),
  tags: Joi.array().items(Joi.string()),
  createdBy: Joi.string().required(),
  isPublic: Joi.boolean().default(false),
  aiGenerated: Joi.boolean().default(false)
});

/**
 * Response answer validation schema
 */
const answerSchema = Joi.object({
  questionId: Joi.string().required(),
  questionText: Joi.string().required(),
  questionType: Joi.string().valid('text', 'multiplechoice', 'checkbox', 'rating', 'boolean').required(),
  value: Joi.alternatives().conditional('questionType', {
    switch: [
      { is: 'text', then: Joi.string().allow('', null) },
      { is: 'multiplechoice', then: Joi.string().required() },
      { is: 'checkbox', then: Joi.array().items(Joi.string()).required() },
      { is: 'rating', then: Joi.number().required() },
      { is: 'boolean', then: Joi.boolean().required() }
    ]
  })
});

/**
 * Response validation schema
 */
const responseSchema = Joi.object({
  survey: Joi.string().required(),
  respondent: Joi.string().allow(null),
  answers: Joi.array().items(answerSchema),
  completed: Joi.boolean().default(false),
  ipAddress: Joi.string().allow('', null),
  userAgent: Joi.string().allow('', null),
  metadata: Joi.object().allow(null)
});

/**
 * Analysis insight validation schema
 */
const insightSchema = Joi.object({
  question: Joi.string().required(),
  analysisText: Joi.string().required(),
  sentiment: Joi.string().valid('positive', 'negative', 'neutral', 'mixed').allow(null),
  keywords: Joi.array().items(Joi.string()),
  score: Joi.number().min(0).max(10).allow(null)
});

/**
 * Analysis validation schema
 */
const analysisSchema = Joi.object({
  survey: Joi.string().required(),
  summary: Joi.string().required(),
  insights: Joi.array().items(insightSchema),
  aiGenerated: Joi.boolean().default(true)
});

/**
 * Validate user data
 * @param {Object} data - User data to validate
 * @returns {Object} Validation result
 */
const validateUser = (data) => {
  return userSchema.validate(data, { abortEarly: false });
};

/**
 * Validate survey data
 * @param {Object} data - Survey data to validate
 * @returns {Object} Validation result
 */
const validateSurvey = (data) => {
  return surveySchema.validate(data, { abortEarly: false });
};

/**
 * Validate template data
 * @param {Object} data - Template data to validate
 * @returns {Object} Validation result
 */
const validateTemplate = (data) => {
  return templateSchema.validate(data, { abortEarly: false });
};

/**
 * Validate response data
 * @param {Object} data - Response data to validate
 * @returns {Object} Validation result
 */
const validateResponse = (data) => {
  return responseSchema.validate(data, { abortEarly: false });
};

/**
 * Validate analysis data
 * @param {Object} data - Analysis data to validate
 * @returns {Object} Validation result
 */
const validateAnalysis = (data) => {
  return analysisSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateUser,
  validateSurvey,
  validateTemplate,
  validateResponse,
  validateAnalysis
}; 