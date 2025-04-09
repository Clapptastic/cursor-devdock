/**
 * Response Controller
 * Handles HTTP requests related to survey responses
 */

const responseModel = require('../models/response');
const logger = require('../utils/logger');
const { supabase } = require('../config/database');

/**
 * Create a new survey response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createResponse = async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    const responseData = {
      ...req.body,
      surveyId,
      respondentIp: req.ip,
      respondentId: req.user?.id || null
    };
    
    // Create response
    const response = await responseModel.createResponse(responseData);
    
    logger.info(`Response created for survey: ${surveyId}`);
    
    res.status(201).json({
      status: 'success',
      data: { response }
    });
  } catch (error) {
    logger.error(`Error creating response: ${error.message}`);
    next(error);
  }
};

/**
 * Get a response by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getResponseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await responseModel.getResponseById(id);
    
    if (!response) {
      return res.status(404).json({
        status: 'error',
        message: 'Response not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { response }
    });
  } catch (error) {
    logger.error(`Error retrieving response: ${error.message}`);
    next(error);
  }
};

/**
 * Get responses for a survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getResponsesBySurveyId = async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    
    // Check if survey exists
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, user_id')
      .eq('id', surveyId)
      .single();
      
    if (surveyError && surveyError.code !== 'PGRST116') {
      logger.error(`Error checking survey: ${surveyError.message}`);
      throw new Error(surveyError.message);
    }
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Verify user has permission to view responses
    // Only the survey owner or an admin can view all responses
    if (!req.user.isAdmin && survey.user_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view these responses'
      });
    }
    
    // Parse query parameters
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const result = await responseModel.getResponsesBySurveyId(surveyId, options);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Error retrieving survey responses: ${error.message}`);
    next(error);
  }
};

/**
 * Update a response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if response exists and user has permission
    const response = await responseModel.getResponseById(id);
    
    if (!response) {
      return res.status(404).json({
        status: 'error',
        message: 'Response not found'
      });
    }
    
    // Verify user has permission
    // Only the respondent or admin can update their own response
    if (!req.user.isAdmin && response.respondent_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this response'
      });
    }
    
    const updatedResponse = await responseModel.updateResponse(id, req.body);
    
    logger.info(`Response updated: ${id}`);
    
    res.status(200).json({
      status: 'success',
      data: { response: updatedResponse }
    });
  } catch (error) {
    logger.error(`Error updating response: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if response exists
    const response = await responseModel.getResponseById(id);
    
    if (!response) {
      return res.status(404).json({
        status: 'error',
        message: 'Response not found'
      });
    }
    
    // Check if survey exists and get owner
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, user_id')
      .eq('id', response.survey_id)
      .single();
      
    if (surveyError && surveyError.code !== 'PGRST116') {
      logger.error(`Error checking survey: ${surveyError.message}`);
      throw new Error(surveyError.message);
    }
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Verify user has permission
    // Only the survey owner, the respondent, or an admin can delete a response
    if (!req.user.isAdmin && survey.user_id !== req.user.id && response.respondent_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this response'
      });
    }
    
    await responseModel.deleteResponse(id);
    
    logger.info(`Response deleted: ${id}`);
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting response: ${error.message}`);
    next(error);
  }
};

/**
 * Get analytics for a survey's responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getResponseAnalytics = async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    
    // Check if survey exists
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, user_id')
      .eq('id', surveyId)
      .single();
      
    if (surveyError && surveyError.code !== 'PGRST116') {
      logger.error(`Error checking survey: ${surveyError.message}`);
      throw new Error(surveyError.message);
    }
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Verify user has permission to view analytics
    // Only the survey owner or an admin can view analytics
    if (!req.user.isAdmin && survey.user_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view these analytics'
      });
    }
    
    const analytics = await responseModel.getResponseAnalytics(surveyId);
    
    res.status(200).json({
      status: 'success',
      data: { analytics }
    });
  } catch (error) {
    logger.error(`Error retrieving response analytics: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createResponse,
  getResponseById,
  getResponsesBySurveyId,
  updateResponse,
  deleteResponse,
  getResponseAnalytics
}; 