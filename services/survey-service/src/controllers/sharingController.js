/**
 * Sharing Controller
 * Handles HTTP requests related to survey sharing
 */

const surveyModel = require('../models/survey');
const logger = require('../utils/logger');
const { supabase } = require('../config/database');

/**
 * Share a survey with another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const shareSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, email, permission, expiresAt } = req.body;
    
    // Check if survey exists and user has permission
    const survey = await surveyModel.getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Verify user is the owner or has admin permissions
    if (survey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to share this survey'
      });
    }
    
    // Share the survey
    const shareData = {
      userId,
      email,
      permission: permission || 'view',
      expiresAt: expiresAt || null,
      createdBy: req.user.id
    };
    
    const result = await surveyModel.shareSurvey(id, shareData);
    
    logger.info(`Survey shared: ${id} with user: ${userId || email}`);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Error sharing survey: ${error.message}`);
    next(error);
  }
};

/**
 * Get all shares for a survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSurveyShares = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if survey exists
    const survey = await surveyModel.getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to view shares
    if (survey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view shares for this survey'
      });
    }
    
    const shares = await surveyModel.getSurveyShares(id);
    
    res.status(200).json({
      status: 'success',
      data: { shares }
    });
  } catch (error) {
    logger.error(`Error retrieving survey shares: ${error.message}`);
    next(error);
  }
};

/**
 * Remove a share from a survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const removeSurveyShare = async (req, res, next) => {
  try {
    const { id, shareId } = req.params;
    
    // Check if survey exists
    const survey = await surveyModel.getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to remove shares
    if (survey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to remove shares for this survey'
      });
    }
    
    await surveyModel.removeSurveyShare(id, shareId);
    
    logger.info(`Survey share removed: ${shareId} from survey: ${id}`);
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Error removing survey share: ${error.message}`);
    next(error);
  }
};

/**
 * Update a share's permissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateSharePermission = async (req, res, next) => {
  try {
    const { id, shareId } = req.params;
    const { permission } = req.body;
    
    // Check if survey exists
    const survey = await surveyModel.getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Check if user has permission to update shares
    if (survey.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update shares for this survey'
      });
    }
    
    // Get the share record
    const { data: share, error } = await supabase
      .from('survey_shares')
      .select('*')
      .eq('id', shareId)
      .eq('survey_id', id)
      .single();
      
    if (error) {
      return res.status(404).json({
        status: 'error',
        message: 'Share record not found'
      });
    }
    
    // Update the permission
    const { data, error: updateError } = await supabase
      .from('survey_shares')
      .update({ 
        permission,
        updated_at: new Date().toISOString() 
      })
      .eq('id', shareId)
      .select();
      
    if (updateError) {
      logger.error(`Error updating share permission: ${updateError.message}`);
      throw new Error(updateError.message);
    }
    
    logger.info(`Survey share updated: ${shareId} for survey: ${id}`);
    
    res.status(200).json({
      status: 'success',
      data: { share: data[0] }
    });
  } catch (error) {
    logger.error(`Error updating share permission: ${error.message}`);
    next(error);
  }
};

module.exports = {
  shareSurvey,
  getSurveyShares,
  removeSurveyShare,
  updateSharePermission
}; 