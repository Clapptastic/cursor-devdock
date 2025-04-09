/**
 * Question Routes
 * Handles routes for question generation and manipulation
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const validate = require('../middleware/validationMiddleware');
const { questionSchemas } = require('../utils/validationSchemas');

/**
 * @route   POST /generate-questions
 * @desc    Generate survey questions based on parameters
 * @access  Public
 */
router.post(
  '/generate-questions',
  validate(questionSchemas.generateQuestions),
  questionController.generateQuestions
);

/**
 * @route   POST /improve-question
 * @desc    Improve an existing question
 * @access  Public
 */
router.post(
  '/improve-question',
  validate(questionSchemas.improveQuestion),
  questionController.improveQuestion
);

/**
 * @route   POST /translate-survey
 * @desc    Translate survey questions to a different language
 * @access  Public
 */
router.post(
  '/translate-survey',
  validate(questionSchemas.translateSurvey),
  questionController.translateSurvey
);

module.exports = router; 