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
 * @route   POST /analyze-responses
 * @desc    Analyze survey responses
 * @access  Public
 */
router.post(
  '/analyze-responses',
  validate(analysisSchemas.analyzeResponses),
  analysisController.analyzeResponses
);

/**
 * @route   POST /extract-themes
 * @desc    Extract common themes from survey responses
 * @access  Public
 */
router.post(
  '/extract-themes',
  validate(analysisSchemas.extractThemes),
  analysisController.extractThemes
);

/**
 * @route   POST /sentiment-analysis
 * @desc    Perform sentiment analysis on survey responses
 * @access  Public
 */
router.post(
  '/sentiment-analysis',
  validate(analysisSchemas.sentimentAnalysis),
  analysisController.sentimentAnalysis
);

/**
 * @route   POST /customer-segmentation
 * @desc    Segment customers based on their responses
 * @access  Public
 */
router.post(
  '/customer-segmentation',
  validate(analysisSchemas.customerSegmentation),
  analysisController.customerSegmentation
);

module.exports = router; 