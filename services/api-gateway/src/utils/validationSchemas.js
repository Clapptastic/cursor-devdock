/**
 * Validation Schemas
 * Defines Joi validation schemas for API request validation
 */

const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().trim(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required().trim(),
    companyName: Joi.string().max(200).allow('', null)
  }),
  
  login: Joi.object({
    email: Joi.string().email().required().trim(),
    password: Joi.string().required()
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().required().trim()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  }),
  
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    companyName: Joi.string().max(200).allow('', null),
    jobTitle: Joi.string().max(100).allow('', null),
    industry: Joi.string().max(100).allow('', null)
  })
};

// Template validation schemas
const templateSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(1000).allow('', null),
    industry_id: Joi.string().uuid().allow(null),
    business_stage_id: Joi.string().uuid().allow(null),
    customer_segment_id: Joi.string().uuid().allow(null),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    is_public: Joi.boolean().default(false)
  }),
  
  update: Joi.object({
    title: Joi.string().min(3).max(200).trim(),
    description: Joi.string().max(1000).allow('', null),
    industry_id: Joi.string().uuid().allow(null),
    business_stage_id: Joi.string().uuid().allow(null),
    customer_segment_id: Joi.string().uuid().allow(null),
    tags: Joi.array().items(Joi.string().trim()),
    is_public: Joi.boolean()
  }),
  
  addQuestion: Joi.object({
    question_text: Joi.string().min(3).max(500).required().trim(),
    description: Joi.string().max(1000).allow('', null),
    question_type_id: Joi.string().uuid().required(),
    is_required: Joi.boolean().default(false),
    settings: Joi.object().default({}),
    order_position: Joi.number().integer().min(0)
  }),
  
  updateQuestion: Joi.object({
    question_text: Joi.string().min(3).max(500).trim(),
    description: Joi.string().max(1000).allow('', null),
    question_type_id: Joi.string().uuid(),
    is_required: Joi.boolean(),
    settings: Joi.object(),
    order_position: Joi.number().integer().min(0)
  }),
  
  reorderQuestions: Joi.object({
    questions: Joi.array().items(
      Joi.object({
        id: Joi.string().uuid().required(),
        order_position: Joi.number().integer().min(0).required()
      })
    ).min(1).required()
  })
};

// Survey validation schemas
const surveySchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(1000).allow('', null),
    template_id: Joi.string().uuid().required(),
    settings: Joi.object().default({}),
    status: Joi.string().valid('draft', 'active').default('draft'),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null)
  }),
  
  update: Joi.object({
    title: Joi.string().min(3).max(200).trim(),
    description: Joi.string().max(1000).allow('', null),
    settings: Joi.object(),
    status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'archived'),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null)
  }),
  
  respondent: Joi.object({
    email: Joi.string().email().required().trim(),
    name: Joi.string().max(100).allow('', null),
    metadata: Joi.object().default({})
  })
};

// Response validation schemas
const responseSchemas = {
  submit: Joi.object({
    survey_id: Joi.string().uuid().required(),
    respondent: Joi.object({
      email: Joi.string().email().required().trim(),
      name: Joi.string().max(100).allow('', null)
    }).required(),
    answers: Joi.array().items(
      Joi.object({
        question_id: Joi.string().uuid().required(),
        value: Joi.any().required()
      })
    ).required(),
    metadata: Joi.object().default({})
  })
};

// AI service validation schemas
const aiSchemas = {
  generateQuestions: Joi.object({
    industry: Joi.string().required(),
    businessStage: Joi.string().required(),
    customerSegment: Joi.string().required(),
    topic: Joi.string().required(),
    count: Joi.number().integer().min(1).max(50).default(10)
  }),
  
  improveQuestion: Joi.object({
    question: Joi.string().required(),
    context: Joi.string().allow('', null)
  }),
  
  analyzeResponses: Joi.object({
    survey_id: Joi.string().uuid().required(),
    includeResponses: Joi.boolean().default(true)
  })
};

// Export validation schemas
const exportSchemas = {
  exportSurvey: Joi.object({
    format: Joi.string().valid('csv', 'xlsx', 'pdf').required(),
    includeAnalysis: Joi.boolean().default(false)
  })
};

module.exports = {
  userSchemas,
  templateSchemas,
  surveySchemas,
  responseSchemas,
  aiSchemas,
  exportSchemas
}; 