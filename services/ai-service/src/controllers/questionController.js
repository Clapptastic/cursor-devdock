/**
 * Question Controller
 * Handles logic for generating and improving survey questions
 */

const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const { successResponse } = require('../utils/responseHelper');

/**
 * Generate survey questions based on parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const generateQuestions = async (req, res, next) => {
  try {
    const { industry, businessStage, customerSegment, topic, count = 10 } = req.body;
    
    logger.info('Generating survey questions', { 
      industry, 
      businessStage, 
      customerSegment, 
      topic, 
      count 
    });
    
    // Call AI service to generate questions
    const questions = await aiService.generateQuestions(
      industry, 
      businessStage, 
      customerSegment, 
      topic, 
      count
    );
    
    return res.status(200).json(successResponse(
      questions,
      `Successfully generated ${questions.length} questions for ${topic}`
    ));
  } catch (error) {
    logger.error('Error generating questions', { error: error.message, stack: error.stack });
    return next(error);
  }
};

/**
 * Improve an existing question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const improveQuestion = async (req, res, next) => {
  try {
    const { question, context } = req.body;
    
    logger.info('Improving question', { 
      questionLength: question.length,
      hasContext: !!context
    });
    
    // Call AI service to improve the question
    const improvedQuestion = await aiService.improveQuestion(question, context);
    
    return res.status(200).json(successResponse(
      improvedQuestion,
      'Question successfully improved'
    ));
  } catch (error) {
    logger.error('Error improving question', { error: error.message, stack: error.stack });
    return next(error);
  }
};

/**
 * Translate survey questions to different language
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const translateSurvey = async (req, res, next) => {
  try {
    const { questions, targetLanguage } = req.body;
    
    logger.info('Translating survey', { 
      questionCount: questions.length,
      targetLanguage
    });
    
    // Call AI service to translate questions
    const translatedQuestions = await aiService.translateSurvey(questions, targetLanguage);
    
    return res.status(200).json(successResponse(
      translatedQuestions,
      `Successfully translated ${translatedQuestions.length} questions to ${targetLanguage}`
    ));
  } catch (error) {
    logger.error('Error translating survey', { error: error.message, stack: error.stack });
    return next(error);
  }
};

module.exports = {
  generateQuestions,
  improveQuestion,
  translateSurvey
}; 