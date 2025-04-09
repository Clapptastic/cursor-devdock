/**
 * Question Generation Routes
 * Handles routes for generating and improving survey questions
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const validate = require('../middleware/validationMiddleware');
const { questionSchemas } = require('../utils/validationSchemas');

/**
 * @route POST /generate-questions
 * @desc Generate survey questions based on industry, business stage, and topic
 * @access Private
 */
router.post('/', validate(questionSchemas.generateQuestions), questionController.generateQuestions);

/**
 * @route POST /improve-question
 * @desc Improve a specific question
 * @access Private
 */
router.post('/', validate(questionSchemas.improveQuestion), questionController.improveQuestion);

/**
 * @route POST /translate-survey
 * @desc Translate survey questions to another language
 * @access Private
 */
router.post('/', validate(questionSchemas.translateSurvey), questionController.translateSurvey);

module.exports = router; 