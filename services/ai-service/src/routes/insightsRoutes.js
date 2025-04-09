/**
 * Insights Routes
 * Handles routes for generating business insights
 */

const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const validate = require('../middleware/validationMiddleware');
const { insightSchemas } = require('../utils/validationSchemas');

/**
 * @route   POST /generate-insights
 * @desc    Generate actionable insights from survey results
 * @access  Public
 */
router.post(
  '/generate-insights',
  validate(insightSchemas.generateInsights),
  insightsController.generateInsights
);

/**
 * @route   POST /suggest-improvements
 * @desc    Suggest business improvements based on feedback
 * @access  Public
 */
router.post(
  '/suggest-improvements',
  validate(insightSchemas.suggestImprovements),
  insightsController.suggestImprovements
);

/**
 * @route   POST /competitor-analysis
 * @desc    Generate competitor analysis insights
 * @access  Public
 */
router.post(
  '/competitor-analysis',
  validate(insightSchemas.competitorAnalysis),
  insightsController.competitorAnalysis
);

/**
 * @route   POST /market-trends
 * @desc    Analyze market trends based on survey data
 * @access  Public
 */
router.post(
  '/market-trends',
  validate(insightSchemas.marketTrends),
  insightsController.marketTrends
);

module.exports = router; 