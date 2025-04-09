/**
 * Validation Schemas
 * 
 * Defines Joi validation schemas for request validation
 */

const Joi = require('joi');

// Question type enum
const questionTypes = [
  'text', 
  'textarea', 
  'singleChoice', 
  'multipleChoice', 
  'rating', 
  'scale',
  'dropdown',
  'boolean',
  'date'
];

// Base question schema
const questionSchema = Joi.object({
  id: Joi.string().trim().uuid(),
  text: Joi.string().trim().required().max(500).messages({
    'string.empty': 'Question text is required',
    'string.max': 'Question text cannot exceed 500 characters'
  }),
  type: Joi.string().valid(...questionTypes).required().messages({
    'any.only': `Question type must be one of: ${questionTypes.join(', ')}`
  }),
  required: Joi.boolean().default(false),
  options: Joi.when('type', {
    is: Joi.string().valid('singleChoice', 'multipleChoice', 'dropdown'),
    then: Joi.array().items(
      Joi.object({
        value: Joi.string().required(),
        label: Joi.string().required()
      })
    ).min(1).required().messages({
      'array.min': 'At least one option is required',
      'array.base': 'Options must be an array'
    }),
    otherwise: Joi.optional()
  }),
  description: Joi.string().trim().max(1000),
  placeholder: Joi.string().trim().max(200),
  minValue: Joi.when('type', {
    is: Joi.string().valid('rating', 'scale'),
    then: Joi.number().required(),
    otherwise: Joi.optional()
  }),
  maxValue: Joi.when('type', {
    is: Joi.string().valid('rating', 'scale'),
    then: Joi.number().required(),
    otherwise: Joi.optional()
  }),
  step: Joi.when('type', {
    is: Joi.string().valid('rating', 'scale'),
    then: Joi.number().positive(),
    otherwise: Joi.optional()
  })
}).unknown(false);

// Create survey schema
const createSurveySchema = Joi.object({
  title: Joi.string().trim().required().max(100).messages({
    'string.empty': 'Survey title is required',
    'string.max': 'Survey title cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Survey description cannot exceed 500 characters'
  }),
  questions: Joi.array().items(questionSchema).min(1).required().messages({
    'array.min': 'At least one question is required',
    'array.base': 'Questions must be an array'
  }),
  status: Joi.string().valid('draft', 'active', 'archived').default('draft'),
  settings: Joi.object({
    allowAnonymous: Joi.boolean().default(false),
    showProgressBar: Joi.boolean().default(true),
    showQuestionNumbers: Joi.boolean().default(true),
    randomizeQuestions: Joi.boolean().default(false),
    responseLimit: Joi.number().integer().min(0).default(0),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }).default({})
}).unknown(false);

// Update survey schema
const updateSurveySchema = Joi.object({
  title: Joi.string().trim().max(100).messages({
    'string.max': 'Survey title cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Survey description cannot exceed 500 characters'
  }),
  questions: Joi.array().items(questionSchema).min(1).messages({
    'array.min': 'At least one question is required',
    'array.base': 'Questions must be an array'
  }),
  status: Joi.string().valid('draft', 'active', 'archived'),
  settings: Joi.object({
    allowAnonymous: Joi.boolean(),
    showProgressBar: Joi.boolean(),
    showQuestionNumbers: Joi.boolean(),
    randomizeQuestions: Joi.boolean(),
    responseLimit: Joi.number().integer().min(0),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  })
}).unknown(false);

// Create template schema
const createTemplateSchema = Joi.object({
  title: Joi.string().trim().required().max(100).messages({
    'string.empty': 'Template title is required',
    'string.max': 'Template title cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Template description cannot exceed 500 characters'
  }),
  questions: Joi.array().items(questionSchema).min(1).required().messages({
    'array.min': 'At least one question is required',
    'array.base': 'Questions must be an array'
  }),
  category: Joi.string().trim().max(50),
  tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
  isPublic: Joi.boolean().default(false)
}).unknown(false);

// Update template schema
const updateTemplateSchema = Joi.object({
  title: Joi.string().trim().max(100).messages({
    'string.max': 'Template title cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Template description cannot exceed 500 characters'
  }),
  questions: Joi.array().items(questionSchema).min(1).messages({
    'array.min': 'At least one question is required',
    'array.base': 'Questions must be an array'
  }),
  category: Joi.string().trim().max(50),
  tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
  isPublic: Joi.boolean()
}).unknown(false);

// Create survey from template schema
const createSurveyFromTemplateSchema = Joi.object({
  title: Joi.string().trim().max(100).messages({
    'string.max': 'Survey title cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Survey description cannot exceed 500 characters'
  }),
  settings: Joi.object({
    allowAnonymous: Joi.boolean().default(false),
    showProgressBar: Joi.boolean().default(true),
    showQuestionNumbers: Joi.boolean().default(true),
    randomizeQuestions: Joi.boolean().default(false),
    responseLimit: Joi.number().integer().min(0).default(0),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }).default({})
}).unknown(false);

// Share survey schema
const shareSurveySchema = Joi.object({
  userId: Joi.string().trim(),
  email: Joi.string().email().trim(),
  permission: Joi.string().valid('view', 'edit', 'admin').default('view'),
  expiresAt: Joi.date().iso().allow(null)
})
.or('userId', 'email')
.messages({
  'object.missing': 'Either userId or email must be provided'
})
.unknown(false);

// Update share permission schema
const updateShareSchema = Joi.object({
  permission: Joi.string().valid('view', 'edit', 'admin').required()
}).unknown(false);

module.exports = {
  createSurveySchema,
  updateSurveySchema,
  createTemplateSchema,
  updateTemplateSchema,
  createSurveyFromTemplateSchema,
  questionSchema,
  shareSurveySchema,
  updateShareSchema
}; 