/**
 * Analysis Routes
 * Handles routes for analyzing survey responses
 */

const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const validate = require('../middleware/validationMiddleware');
const { analysisSchemas } = require('../utils/validationSchemas');

/**
 * @route POST /analyze-responses
 * @desc Generate a comprehensive analysis of survey responses
 * @access Private
 */
router.post('/', validate(analysisSchemas.analyzeResponses), analysisController.analyzeResponses);

/**
 * @route POST /extract-themes
 * @desc Extract common themes from open-ended responses
 * @access Private
 */
router.post('/', validate(analysisSchemas.extractThemes), analysisController.extractThemes);

/**
 * @route POST /sentiment-analysis
 * @desc Perform sentiment analysis on survey responses
 * @access Private
 */
router.post('/', validate(analysisSchemas.sentimentAnalysis), analysisController.sentimentAnalysis);

/**
 * @route POST /customer-segmentation
 * @desc Segment customers based on their responses
 * @access Private (Premium)
 */
router.post('/', validate(analysisSchemas.customerSegmentation), analysisController.customerSegmentation);

module.exports = router; 