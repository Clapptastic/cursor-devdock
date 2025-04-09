/**
 * Validation Schemas
 * 
 * Defines Joi validation schemas for request validation in the Response Service
 */

const Joi = require('joi');

// Answer value schema - depends on question type
const createAnswerValueSchema = (type) => {
  switch (type) {
    case 'text':
    case 'textarea':
      return Joi.string().trim().allow('');
    
    case 'singleChoice':
    case 'dropdown':
      return Joi.string().trim().required();
    
    case 'multipleChoice':
      return Joi.array().items(Joi.string().trim()).min(1);
    
    case 'rating':
    case 'scale':
      return Joi.number().required();
    
    case 'boolean':
      return Joi.boolean().required();
    
    case 'date':
      return Joi.date().iso().required();
    
    default:
      return Joi.any();
  }
};

// Individual answer schema
const answerSchema = Joi.object({
  questionId: Joi.string().required(),
  questionText: Joi.string().required(),
  questionType: Joi.string().valid(
    'text', 
    'textarea', 
    'singleChoice', 
    'multipleChoice', 
    'rating', 
    'scale',
    'dropdown',
    'boolean',
    'date'
  ).required(),
  value: Joi.when('questionType', {
    switch: [
      {
        is: 'text',
        then: createAnswerValueSchema('text')
      },
      {
        is: 'textarea',
        then: createAnswerValueSchema('textarea')
      },
      {
        is: 'singleChoice',
        then: createAnswerValueSchema('singleChoice')
      },
      {
        is: 'multipleChoice',
        then: createAnswerValueSchema('multipleChoice')
      },
      {
        is: 'rating',
        then: createAnswerValueSchema('rating')
      },
      {
        is: 'scale',
        then: createAnswerValueSchema('scale')
      },
      {
        is: 'dropdown',
        then: createAnswerValueSchema('dropdown')
      },
      {
        is: 'boolean',
        then: createAnswerValueSchema('boolean')
      },
      {
        is: 'date',
        then: createAnswerValueSchema('date')
      }
    ],
    otherwise: Joi.any().required()
  })
}).unknown(false);

// Create response schema
const createResponseSchema = Joi.object({
  respondentEmail: Joi.string().email().trim(),
  completionTime: Joi.number().integer().min(0),
  status: Joi.string().valid('started', 'completed', 'abandoned').default('completed'),
  answers: Joi.array().items(answerSchema).min(1).required().messages({
    'array.min': 'At least one answer is required',
    'array.base': 'Answers must be an array'
  }),
  metadata: Joi.object().default({})
}).unknown(false);

// Update response schema
const updateResponseSchema = Joi.object({
  status: Joi.string().valid('started', 'completed', 'abandoned'),
  completionTime: Joi.number().integer().min(0),
  answers: Joi.array().items(answerSchema).min(1).messages({
    'array.min': 'At least one answer is required',
    'array.base': 'Answers must be an array'
  }),
  metadata: Joi.object()
}).unknown(false);

// Response filters schema (for query params)
const responseFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('started', 'completed', 'abandoned'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate'))
}).unknown(false);

module.exports = {
  createResponseSchema,
  updateResponseSchema,
  responseFiltersSchema,
  answerSchema
}; 