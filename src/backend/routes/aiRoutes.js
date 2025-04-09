const express = require('express');
const { 
  generateSurveyQuestions, 
  analyzeSurveyResponses, 
  optimizeSurvey,
  generateSurvey,
  analyzeSurvey
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Survey generation routes
router.post('/generate-survey-questions', generateSurveyQuestions);
router.post('/generate-survey', generateSurvey);

// Analysis routes
router.post('/analyze-responses', analyzeSurveyResponses);

/**
 * @route   POST /api/ai/optimize-survey
 * @desc    Enhance a survey with AI suggestions
 * @access  Private
 */
router.post('/optimize-survey', asyncHandler(optimizeSurvey));

/**
 * @route   POST /api/ai/analyze-survey
 * @desc    Analyze a survey and its responses with AI
 * @access  Private
 */
router.post('/analyze-survey', asyncHandler(analyzeSurvey));

module.exports = router; 