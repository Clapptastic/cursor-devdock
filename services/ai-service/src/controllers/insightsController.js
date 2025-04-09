/**
 * Insights Controller
 * Handles logic for generating business insights and recommendations
 */

const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const { successResponse, acceptedResponse } = require('../utils/responseHelper');
const { NotFoundError } = require('../utils/errors');

/**
 * Generate actionable insights from survey results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const generateInsights = async (req, res, next) => {
  try {
    const { survey_id, options = {} } = req.body;

    logger.info('Generating insights from survey', { 
      survey_id,
      options 
    });
    
    // Call AI service to generate insights
    const insights = await aiService.generateInsights(survey_id);
    
    return res.status(200).json(successResponse(
      insights,
      'Insights generated successfully'
    ));
  } catch (error) {
    logger.error('Error generating insights', { error: error.message, stack: error.stack });
    return next(error);
  }
};

/**
 * Suggest business improvements based on feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const suggestImprovements = async (req, res, next) => {
  try {
    const { survey_id, focus = 'all' } = req.body;
    
    logger.info('Suggesting improvements based on survey', { 
      survey_id,
      focus 
    });
    
    // For demo purposes, return mock data
    // In a real implementation, this would call the AI model
    const improvements = {
      focus,
      areas: [
        {
          area: 'Product Usability',
          score: 3.7,
          suggestions: [
            'Simplify the onboarding process with interactive tutorials',
            'Reduce the number of steps required to complete common tasks',
            'Improve accessibility features for users with disabilities'
          ],
          impact: 'high',
          effort: 'medium'
        },
        {
          area: 'Customer Support',
          score: 4.2,
          suggestions: [
            'Extend support hours to cover more time zones',
            'Add live chat option for immediate assistance',
            'Create more self-service troubleshooting guides'
          ],
          impact: 'medium',
          effort: 'medium'
        },
        {
          area: 'Pricing Structure',
          score: 3.4,
          suggestions: [
            'Introduce a more flexible tier between Basic and Premium',
            'Offer monthly billing options for annual plans',
            'Create packaged bundles for specific use cases'
          ],
          impact: 'high',
          effort: 'low'
        }
      ],
      priorityFocus: 'Product Usability'
    };
    
    return res.status(200).json(successResponse(
      improvements,
      'Improvement suggestions generated successfully'
    ));
  } catch (error) {
    logger.error('Error suggesting improvements', { error: error.message, stack: error.stack });
    return next(error);
  }
};

/**
 * Generate competitor analysis insights
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const competitorAnalysis = async (req, res, next) => {
  try {
    const { survey_id, competitors } = req.body;
    
    logger.info('Generating competitor analysis', { 
      survey_id,
      competitorCount: competitors.length 
    });
    
    // Since this is a premium feature that will take time to process
    // We return an accepted response and process it asynchronously
    const jobId = `job-${Date.now()}`;
    
    // In a real implementation, this would create a background job
    // and send results via notification when complete
    
    return res.status(202).json(acceptedResponse(
      'Competitor analysis job started. You will be notified when complete.',
      jobId
    ));
  } catch (error) {
    logger.error('Error in competitor analysis', { error: error.message, stack: error.stack });
    return next(error);
  }
};

/**
 * Analyze market trends based on survey data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const marketTrends = async (req, res, next) => {
  try {
    const { industry, timeRange = 'all' } = req.body;
    
    logger.info('Analyzing market trends', { 
      industry,
      timeRange 
    });
    
    // For demo purposes, return mock data
    // In a real implementation, this would call the AI model
    const trends = {
      industry,
      timeRange,
      trends: [
        {
          name: 'Remote Work Solutions',
          growth: 'high',
          maturity: 'growing',
          relevance: 'high'
        },
        {
          name: 'AI-Enhanced Productivity',
          growth: 'rapid',
          maturity: 'early',
          relevance: 'high'
        },
        {
          name: 'Subscription-Based Pricing',
          growth: 'stable',
          maturity: 'mature',
          relevance: 'medium'
        }
      ],
      opportunities: [
        'Focus on AI-powered features for competitive advantage',
        'Develop specialized solutions for remote teams',
        'Explore hybrid pricing models'
      ]
    };
    
    return res.status(200).json(successResponse(
      trends,
      'Market trends analysis completed successfully'
    ));
  } catch (error) {
    logger.error('Error analyzing market trends', { error: error.message, stack: error.stack });
    return next(error);
  }
};

module.exports = {
  generateInsights,
  suggestImprovements,
  competitorAnalysis,
  marketTrends
}; 