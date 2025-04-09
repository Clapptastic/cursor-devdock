/**
 * Template Controller
 * Handles HTTP requests related to survey templates
 */

const surveyModel = require('../models/survey');
const logger = require('../utils/logger');

/**
 * Get all templates for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserTemplates = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const searchParams = {
      user_id: userId,
      is_template: true,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    const result = await surveyModel.searchSurveys(searchParams);
    
    res.status(200).json({
      status: 'success',
      data: {
        templates: result.surveys,
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error(`Error retrieving user templates: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createTemplate = async (req, res, next) => {
  try {
    const { user } = req;
    const templateData = {
      ...req.body,
      user_id: user.id,
      status: 'active',
      is_template: true
    };
    
    const template = await surveyModel.createSurvey(templateData);
    
    logger.info(`Template created: ${template.id}`);
    
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
 * Get a template by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await surveyModel.getSurveyById(id);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }
    
    // Verify this is actually a template
    if (!template.is_template) {
      return res.status(400).json({
        status: 'error',
        message: 'The requested resource is not a template'
      });
    }
    
    // Check if user has permission to view the template
    if (template.user_id !== req.user.id && !template.isPublic && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this template'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { template }
    });
  } catch (error) {
    logger.error(`Error retrieving template: ${error.message}`);
    next(error);
  }
};

/**
 * Update a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if template exists
    const existingTemplate = await surveyModel.getSurveyById(id);
    
    if (!existingTemplate) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }
    
    // Verify this is actually a template
    if (!existingTemplate.is_template) {
      return res.status(400).json({
        status: 'error',
        message: 'The requested resource is not a template'
      });
    }
    
    // Check if user has permission to update the template
    if (existingTemplate.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this template'
      });
    }
    
    const updatedTemplate = await surveyModel.updateSurvey(id, updateData);
    
    logger.info(`Template updated: ${id}`);
    
    res.status(200).json({
      status: 'success',
      data: { template: updatedTemplate }
    });
  } catch (error) {
    logger.error(`Error updating template: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const existingTemplate = await surveyModel.getSurveyById(id);
    
    if (!existingTemplate) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }
    
    // Verify this is actually a template
    if (!existingTemplate.is_template) {
      return res.status(400).json({
        status: 'error',
        message: 'The requested resource is not a template'
      });
    }
    
    // Check if user has permission to delete the template
    if (existingTemplate.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this template'
      });
    }
    
    await surveyModel.deleteSurvey(id);
    
    logger.info(`Template deleted: ${id}`);
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting template: ${error.message}`);
    next(error);
  }
};

/**
 * Create a survey from a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createSurveyFromTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get the template
    const template = await surveyModel.getSurveyById(id);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }
    
    // Verify this is actually a template
    if (!template.is_template) {
      return res.status(400).json({
        status: 'error',
        message: 'The requested resource is not a template'
      });
    }
    
    // Check if user has permission to use the template
    if (template.user_id !== userId && !template.isPublic && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this template'
      });
    }
    
    // Create a new survey based on the template
    const surveyData = {
      title: req.body.title || template.title,
      description: req.body.description || template.description,
      questions: template.questions,
      user_id: userId,
      status: 'draft',
      is_template: false,
      settings: req.body.settings || {},
      template_id: template.id
    };
    
    const survey = await surveyModel.createSurvey(surveyData);
    
    logger.info(`Survey created from template: ${survey.id} (template: ${id})`);
    
    res.status(201).json({
      status: 'success',
      data: { survey }
    });
  } catch (error) {
    logger.error(`Error creating survey from template: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getUserTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  createSurveyFromTemplate
}; 