/**
 * Survey Controller
 * Handles HTTP requests related to surveys
 */

const surveyModel = require('../models/survey');
const logger = require('../utils/logger');

/**
 * Create a new survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createSurvey = async (req, res, next) => {
  try {
    const { user } = req;
    const surveyData = {
      ...req.body,
      user_id: user.id,
      status: req.body.status || 'draft',
      is_template: false
    };
    
    const survey = await surveyModel.createSurvey(surveyData);
    
    logger.info(`Survey created: ${survey.id}`);
    
    res.status(201).json({
      status: 'success',
      data: { survey }
    });
  } catch (error) {
    logger.error(`Error creating survey: ${error.message}`);
    next(error);
  }
};

/**
 * Get a survey by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const survey = await surveyModel.getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to view the survey
    if (survey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this survey'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { survey }
    });
  } catch (error) {
    logger.error(`Error retrieving survey: ${error.message}`);
    next(error);
  }
};

/**
 * Get all surveys for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserSurveys = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status
    };
    
    const result = await surveyModel.getSurveysByUserId(userId, options);
    
    res.status(200).json({
      status: 'success',
      data: {
        surveys: result.surveys,
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error(`Error retrieving user surveys: ${error.message}`);
    next(error);
  }
};

/**
 * Update a survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if survey exists
    const existingSurvey = await surveyModel.getSurveyById(id);
    
    if (!existingSurvey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to update the survey
    if (existingSurvey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this survey'
      });
    }
    
    const updatedSurvey = await surveyModel.updateSurvey(id, updateData);
    
    logger.info(`Survey updated: ${id}`);
    
    res.status(200).json({
      status: 'success',
      data: { survey: updatedSurvey }
    });
  } catch (error) {
    logger.error(`Error updating survey: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if survey exists
    const existingSurvey = await surveyModel.getSurveyById(id);
    
    if (!existingSurvey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to delete the survey
    if (existingSurvey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this survey'
      });
    }
    
    await surveyModel.deleteSurvey(id);
    
    logger.info(`Survey deleted: ${id}`);
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting survey: ${error.message}`);
    next(error);
  }
};

/**
 * Create a template from an existing survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;
    
    // Check if survey exists
    const existingSurvey = await surveyModel.getSurveyById(id);
    
    if (!existingSurvey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to create template from this survey
    if (existingSurvey.user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to create a template from this survey'
      });
    }
    
    const template = await surveyModel.createTemplateFromSurvey(id, userId, {
      title,
      description
    });
    
    logger.info(`Template created from survey: ${id}`);
    
    res.status(201).json({
      status: 'success',
      data: { template }
    });
  } catch (error) {
    logger.error(`Error creating template: ${error.message}`);
    next(error);
  }
};

/**
 * Search for surveys
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const searchSurveys = async (req, res, next) => {
  try {
    const { title, status, is_template, page = 1, limit = 10 } = req.query;
    
    const searchParams = {
      title,
      status,
      is_template: is_template === 'true',
      user_id: req.user.id, // Limit search to user's own surveys
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    // Only pass defined parameters
    Object.keys(searchParams).forEach(key => 
      searchParams[key] === undefined && delete searchParams[key]
    );
    
    const result = await surveyModel.searchSurveys(searchParams);
    
    res.status(200).json({
      status: 'success',
      data: {
        surveys: result.surveys,
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error(`Error searching surveys: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createSurvey,
  getSurvey,
  getUserSurveys,
  updateSurvey,
  deleteSurvey,
  createTemplate,
  searchSurveys
}; 