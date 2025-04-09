/**
 * Validation Schemas
 * Defines Joi validation schemas for request validation
 */

const Joi = require('joi');

// Question generation schemas
const questionSchemas = {
  generateQuestions: Joi.object({
    industry: Joi.string().required().trim(),
    businessStage: Joi.string().required().trim(),
    customerSegment: Joi.string().required().trim(),
    topic: Joi.string().required().trim(),
    count: Joi.number().integer().min(1).max(100).default(10)
  }),

  improveQuestion: Joi.object({
    question: Joi.string().required().trim().min(5).max(2000),
    context: Joi.string().allow('', null)
  }),

  translateSurvey: Joi.object({
    questions: Joi.array().items(
      Joi.object({
        id: Joi.string().optional(),
        question_text: Joi.string().required().trim(),
        description: Joi.string().allow('', null)
      })
    ).min(1).required(),
    targetLanguage: Joi.string().required().trim()
  })
};

// Analysis schemas
const analysisSchemas = {
  analyzeResponses: Joi.object({
    survey_id: Joi.string().required().trim(),
    includeResponses: Joi.boolean().default(true)
  }),

  extractThemes: Joi.object({
    survey_id: Joi.string().required().trim(),
    options: Joi.object({
      minThemeCount: Joi.number().integer().min(1).default(3),
      maxThemes: Joi.number().integer().min(1).max(50).default(10),
      includeKeyPhrases: Joi.boolean().default(true)
    }).default({})
  }),

  sentimentAnalysis: Joi.object({
    survey_id: Joi.string().required().trim(),
    questionIds: Joi.array().items(Joi.string()).optional()
  }),

  customerSegmentation: Joi.object({
    survey_id: Joi.string().required().trim(),
    segments: Joi.number().integer().min(2).max(10).default(3),
    includeDescriptions: Joi.boolean().default(true)
  })
};

// Insights schemas
const insightSchemas = {
  generateInsights: Joi.object({
    survey_id: Joi.string().required().trim(),
    options: Joi.object({
      includeRecommendations: Joi.boolean().default(true),
      focusAreas: Joi.array().items(Joi.string()).optional()
    }).default({})
  }),

  suggestImprovements: Joi.object({
    survey_id: Joi.string().required().trim(),
    focus: Joi.string().valid('product', 'service', 'experience', 'all').default('all')
  }),

  competitorAnalysis: Joi.object({
    survey_id: Joi.string().required().trim(),
    competitors: Joi.array().items(Joi.string()).min(1).required()
  }),

  marketTrends: Joi.object({
    industry: Joi.string().required().trim(),
    timeRange: Joi.string().valid('month', 'quarter', 'year', 'all').default('all')
  })
};

module.exports = {
  questionSchemas,
  analysisSchemas,
  insightSchemas
}; 