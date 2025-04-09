/**
 * Survey Model
 * This module provides functions for database operations on survey data using Supabase
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Table name for surveys
const SURVEYS_TABLE = 'surveys';

/**
 * Create a new survey
 * @param {Object} surveyData - The survey data
 * @returns {Promise<Object>} - The created survey
 */
const createSurvey = async (surveyData) => {
  try {
    const survey = {
      id: uuidv4(),
      ...surveyData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(SURVEYS_TABLE)
      .insert(survey)
      .select();

    if (error) {
      logger.error(`Error creating survey: ${error.message}`);
      throw new Error(error.message);
    }

    return data[0];
  } catch (error) {
    logger.error(`Failed to create survey: ${error.message}`);
    throw error;
  }
};

/**
 * Get a survey by ID
 * @param {string} id - The survey ID
 * @returns {Promise<Object>} - The survey data
 */
const getSurveyById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(SURVEYS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      logger.error(`Error retrieving survey: ${error.message}`);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    logger.error(`Failed to get survey by ID: ${error.message}`);
    throw error;
  }
};

/**
 * Get surveys by user ID
 * @param {string} userId - The user ID
 * @param {Object} options - Pagination and filtering options
 * @returns {Promise<Array>} - The user's surveys
 */
const getSurveysByUserId = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(SURVEYS_TABLE)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error(`Error retrieving user surveys: ${error.message}`);
      throw new Error(error.message);
    }

    return {
      surveys: data,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error(`Failed to get surveys by user ID: ${error.message}`);
    throw error;
  }
};

/**
 * Update a survey
 * @param {string} id - The survey ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated survey
 */
const updateSurvey = async (id, updateData) => {
  try {
    const updates = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(SURVEYS_TABLE)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      logger.error(`Error updating survey: ${error.message}`);
      throw new Error(error.message);
    }

    if (data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    logger.error(`Failed to update survey: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a survey
 * @param {string} id - The survey ID
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
const deleteSurvey = async (id) => {
  try {
    const { error } = await supabase
      .from(SURVEYS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`Error deleting survey: ${error.message}`);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    logger.error(`Failed to delete survey: ${error.message}`);
    throw error;
  }
};

/**
 * Clone a survey as a template
 * @param {string} id - Original survey ID
 * @param {string} userId - User ID for the new template
 * @param {Object} templateData - Additional template data
 * @returns {Promise<Object>} - The created template
 */
const createTemplateFromSurvey = async (id, userId, templateData = {}) => {
  try {
    // Get the original survey
    const survey = await getSurveyById(id);
    
    if (!survey) {
      throw new Error('Survey not found');
    }
    
    // Create new template based on survey
    const template = {
      id: uuidv4(),
      user_id: userId,
      title: templateData.title || `${survey.title} (Template)`,
      description: templateData.description || survey.description,
      questions: survey.questions,
      is_template: true,
      original_survey_id: id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(SURVEYS_TABLE)
      .insert(template)
      .select();
      
    if (error) {
      logger.error(`Error creating template: ${error.message}`);
      throw new Error(error.message);
    }
    
    return data[0];
  } catch (error) {
    logger.error(`Failed to create template from survey: ${error.message}`);
    throw error;
  }
};

/**
 * Search for surveys
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Array>} - Matching surveys
 */
const searchSurveys = async (searchParams) => {
  try {
    const { title, user_id, status, is_template, page = 1, limit = 10 } = searchParams;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from(SURVEYS_TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (title) {
      query = query.ilike('title', `%${title}%`);
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (is_template !== undefined) {
      query = query.eq('is_template', is_template);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      logger.error(`Error searching surveys: ${error.message}`);
      throw new Error(error.message);
    }
    
    return {
      surveys: data,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error(`Failed to search surveys: ${error.message}`);
    throw error;
  }
};

/**
 * Share a survey with other users
 * @param {string} id - The survey ID
 * @param {Object} shareData - Share settings and permissions
 * @returns {Promise<Object>} - The updated survey with sharing info
 */
const shareSurvey = async (id, shareData) => {
  try {
    // Check if survey exists
    const survey = await getSurveyById(id);
    
    if (!survey) {
      throw new Error('Survey not found');
    }
    
    // Create sharing record in survey_shares table
    const shareRecord = {
      id: uuidv4(),
      survey_id: id,
      user_id: shareData.userId,
      permission: shareData.permission || 'view', // view, edit, or admin
      email: shareData.email,
      created_at: new Date().toISOString(),
      created_by: shareData.createdBy,
      expires_at: shareData.expiresAt || null
    };
    
    const { data: shareData, error: shareError } = await supabase
      .from('survey_shares')
      .insert(shareRecord)
      .select();
      
    if (shareError) {
      logger.error(`Error sharing survey: ${shareError.message}`);
      throw new Error(shareError.message);
    }
    
    // Update survey with sharing status
    const updates = {
      is_shared: true,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(SURVEYS_TABLE)
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) {
      logger.error(`Error updating survey sharing status: ${error.message}`);
      throw new Error(error.message);
    }
    
    return {
      survey: data[0],
      share: shareData[0]
    };
  } catch (error) {
    logger.error(`Failed to share survey: ${error.message}`);
    throw error;
  }
};

/**
 * Get users with whom a survey is shared
 * @param {string} id - The survey ID
 * @returns {Promise<Array>} - List of users with access to the survey
 */
const getSurveyShares = async (id) => {
  try {
    const { data, error } = await supabase
      .from('survey_shares')
      .select('*')
      .eq('survey_id', id);
      
    if (error) {
      logger.error(`Error retrieving survey shares: ${error.message}`);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    logger.error(`Failed to get survey shares: ${error.message}`);
    throw error;
  }
};

/**
 * Remove sharing access for a user
 * @param {string} surveyId - The survey ID
 * @param {string} shareId - The share record ID to remove
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
const removeSurveyShare = async (surveyId, shareId) => {
  try {
    // Delete the share record
    const { error } = await supabase
      .from('survey_shares')
      .delete()
      .eq('id', shareId)
      .eq('survey_id', surveyId);
      
    if (error) {
      logger.error(`Error removing survey share: ${error.message}`);
      throw new Error(error.message);
    }
    
    // Check if any shares remain
    const { data: remainingShares, error: countError } = await supabase
      .from('survey_shares')
      .select('id')
      .eq('survey_id', surveyId);
      
    if (countError) {
      logger.error(`Error checking remaining shares: ${countError.message}`);
      throw new Error(countError.message);
    }
    
    // If no shares remain, update survey sharing status
    if (remainingShares.length === 0) {
      const { error: updateError } = await supabase
        .from(SURVEYS_TABLE)
        .update({ is_shared: false, updated_at: new Date().toISOString() })
        .eq('id', surveyId);
        
      if (updateError) {
        logger.error(`Error updating survey sharing status: ${updateError.message}`);
        throw new Error(updateError.message);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to remove survey share: ${error.message}`);
    throw error;
  }
};

/**
 * Check if a user has access to a survey
 * @param {string} surveyId - The survey ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Access information or null if no access
 */
const checkSurveyAccess = async (surveyId, userId) => {
  try {
    // First check if user is the owner
    const { data: survey, error: surveyError } = await supabase
      .from(SURVEYS_TABLE)
      .select('user_id')
      .eq('id', surveyId)
      .single();
      
    if (surveyError && surveyError.code !== 'PGRST116') {
      logger.error(`Error checking survey ownership: ${surveyError.message}`);
      throw new Error(surveyError.message);
    }
    
    // If user is the owner, they have full access
    if (survey && survey.user_id === userId) {
      return { 
        accessLevel: 'owner',
        permission: 'full'
      };
    }
    
    // Check shared access
    const { data, error } = await supabase
      .from('survey_shares')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      logger.error(`Error checking survey access: ${error.message}`);
      throw new Error(error.message);
    }
    
    // Check if access has expired
    if (data && data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      if (expiryDate < new Date()) {
        return null; // Access has expired
      }
    }
    
    return data ? {
      accessLevel: 'shared',
      permission: data.permission,
      shareId: data.id
    } : null;
  } catch (error) {
    logger.error(`Failed to check survey access: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createSurvey,
  getSurveyById,
  getSurveysByUserId,
  updateSurvey,
  deleteSurvey,
  createTemplateFromSurvey,
  searchSurveys,
  shareSurvey,
  getSurveyShares,
  removeSurveyShare,
  checkSurveyAccess
}; 