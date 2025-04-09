/**
 * Response Model
 * This module provides functions for database operations on survey responses using Supabase
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Table name for responses
const RESPONSES_TABLE = 'survey_responses';
const RESPONSE_ANSWERS_TABLE = 'response_answers';

/**
 * Create a new survey response
 * @param {Object} responseData - The response data
 * @returns {Promise<Object>} - The created response with answers
 */
const createResponse = async (responseData) => {
  try {
    // Start a Supabase transaction
    const { data: client } = await supabase.rpc('begin_transaction');
    
    // Create the response header record
    const responseHeader = {
      id: uuidv4(),
      survey_id: responseData.surveyId,
      respondent_id: responseData.respondentId || null,
      respondent_email: responseData.respondentEmail || null,
      respondent_ip: responseData.respondentIp || null,
      completion_time: responseData.completionTime || null,
      status: responseData.status || 'completed',
      metadata: responseData.metadata || {},
      created_at: new Date().toISOString()
    };
    
    const { data: responseRecord, error: responseError } = await supabase
      .from(RESPONSES_TABLE)
      .insert(responseHeader)
      .select();
      
    if (responseError) {
      logger.error(`Error creating response: ${responseError.message}`);
      throw new Error(responseError.message);
    }
    
    // Process and insert answers
    const answers = Array.isArray(responseData.answers) ? 
      responseData.answers.map(answer => ({
        id: uuidv4(),
        response_id: responseRecord[0].id,
        question_id: answer.questionId,
        question_text: answer.questionText,
        question_type: answer.questionType,
        answer_value: answer.value,
        created_at: new Date().toISOString()
      })) : [];
      
    if (answers.length > 0) {
      const { error: answersError } = await supabase
        .from(RESPONSE_ANSWERS_TABLE)
        .insert(answers);
        
      if (answersError) {
        logger.error(`Error creating response answers: ${answersError.message}`);
        throw new Error(answersError.message);
      }
    }
    
    // Fetch the complete response with answers
    const { data: completeResponse, error: fetchError } = await supabase
      .from(RESPONSES_TABLE)
      .select(`
        *,
        answers:${RESPONSE_ANSWERS_TABLE}(*)
      `)
      .eq('id', responseRecord[0].id)
      .single();
      
    if (fetchError) {
      logger.error(`Error fetching complete response: ${fetchError.message}`);
      throw new Error(fetchError.message);
    }
    
    return completeResponse;
  } catch (error) {
    logger.error(`Failed to create response: ${error.message}`);
    throw error;
  }
};

/**
 * Get a response by ID
 * @param {string} id - The response ID
 * @returns {Promise<Object>} - The response data with answers
 */
const getResponseById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(RESPONSES_TABLE)
      .select(`
        *,
        answers:${RESPONSE_ANSWERS_TABLE}(*)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      logger.error(`Error retrieving response: ${error.message}`);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    logger.error(`Failed to get response by ID: ${error.message}`);
    throw error;
  }
};

/**
 * Get responses for a survey
 * @param {string} surveyId - The survey ID
 * @param {Object} options - Pagination and filtering options
 * @returns {Promise<Object>} - The survey responses with pagination
 */
const getResponsesBySurveyId = async (surveyId, options = {}) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from(RESPONSES_TABLE)
      .select('*', { count: 'exact' })
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      logger.error(`Error retrieving survey responses: ${error.message}`);
      throw new Error(error.message);
    }
    
    // Fetch answers for each response
    const responsesWithAnswers = await Promise.all(data.map(async (response) => {
      const { data: answers, error: answersError } = await supabase
        .from(RESPONSE_ANSWERS_TABLE)
        .select('*')
        .eq('response_id', response.id);
        
      if (answersError) {
        logger.error(`Error retrieving response answers: ${answersError.message}`);
        throw new Error(answersError.message);
      }
      
      return { ...response, answers };
    }));
    
    return {
      responses: responsesWithAnswers,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error(`Failed to get responses by survey ID: ${error.message}`);
    throw error;
  }
};

/**
 * Update a response
 * @param {string} id - The response ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated response
 */
const updateResponse = async (id, updateData) => {
  try {
    const updates = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Remove the answers field if present as it's handled separately
    if (updates.answers) {
      delete updates.answers;
    }
    
    const { data, error } = await supabase
      .from(RESPONSES_TABLE)
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) {
      logger.error(`Error updating response: ${error.message}`);
      throw new Error(error.message);
    }
    
    if (data.length === 0) {
      return null;
    }
    
    return data[0];
  } catch (error) {
    logger.error(`Failed to update response: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a response
 * @param {string} id - The response ID
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
const deleteResponse = async (id) => {
  try {
    // First check if the response exists
    const { data, error } = await supabase
      .from(RESPONSES_TABLE)
      .select('id')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No response found
      }
      logger.error(`Error checking response: ${error.message}`);
      throw new Error(error.message);
    }
    
    // Delete the response (cascade will delete answers)
    const { error: deleteError } = await supabase
      .from(RESPONSES_TABLE)
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      logger.error(`Error deleting response: ${deleteError.message}`);
      throw new Error(deleteError.message);
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to delete response: ${error.message}`);
    throw error;
  }
};

/**
 * Get response analytics for a survey
 * @param {string} surveyId - The survey ID
 * @returns {Promise<Object>} - Analytics data
 */
const getResponseAnalytics = async (surveyId) => {
  try {
    // Get total response count
    const { data: countData, error: countError } = await supabase
      .from(RESPONSES_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('survey_id', surveyId);
      
    if (countError) {
      logger.error(`Error getting response count: ${countError.message}`);
      throw new Error(countError.message);
    }
    
    // Get response count by status
    const { data: statusData, error: statusError } = await supabase
      .from(RESPONSES_TABLE)
      .select('status')
      .eq('survey_id', surveyId);
      
    if (statusError) {
      logger.error(`Error getting status data: ${statusError.message}`);
      throw new Error(statusError.message);
    }
    
    // Count responses by status
    const statusCounts = statusData.reduce((acc, response) => {
      const status = response.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Get completion rate (completed / total)
    const completedCount = statusCounts['completed'] || 0;
    const totalCount = statusData.length;
    const completionRate = totalCount > 0 ? completedCount / totalCount : 0;
    
    // Get average completion time
    const { data: timeData, error: timeError } = await supabase
      .from(RESPONSES_TABLE)
      .select('completion_time')
      .eq('survey_id', surveyId)
      .not('completion_time', 'is', null);
      
    if (timeError) {
      logger.error(`Error getting completion time data: ${timeError.message}`);
      throw new Error(timeError.message);
    }
    
    const totalCompletionTime = timeData.reduce((sum, response) => sum + response.completion_time, 0);
    const avgCompletionTime = timeData.length > 0 ? totalCompletionTime / timeData.length : 0;
    
    return {
      totalResponses: totalCount,
      statusBreakdown: statusCounts,
      completionRate,
      averageCompletionTime: avgCompletionTime,
      responsesByDate: await getResponsesByDate(surveyId)
    };
  } catch (error) {
    logger.error(`Failed to get response analytics: ${error.message}`);
    throw error;
  }
};

/**
 * Helper function to get responses grouped by date
 * @param {string} surveyId - The survey ID
 * @returns {Promise<Object>} - Responses by date
 */
const getResponsesByDate = async (surveyId) => {
  try {
    const { data, error } = await supabase
      .from(RESPONSES_TABLE)
      .select('created_at')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: true });
      
    if (error) {
      logger.error(`Error getting responses by date: ${error.message}`);
      throw new Error(error.message);
    }
    
    // Group responses by date
    const responsesByDate = data.reduce((acc, response) => {
      const date = response.created_at.split('T')[0]; // Extract YYYY-MM-DD
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    return responsesByDate;
  } catch (error) {
    logger.error(`Failed to get responses by date: ${error.message}`);
    throw error;
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