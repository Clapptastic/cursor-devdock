/**
 * Insights Routes
 * Handles routes for generating actionable insights and recommendations
 */

const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const validate = require('../middleware/validationMiddleware');
const { insightSchemas } = require('../utils/validationSchemas');

/**
 * @route POST /generate-insights
 * @desc Generate actionable insights from survey results
 * @access Private
 */
router.post('/', validate(insightSchemas.generateInsights), insightsController.generateInsights);

/**
 * @route POST /suggest-improvements
 * @desc Suggest business improvements based on feedback
 * @access Private
 */
router.post('/', validate(insightSchemas.suggestImprovements), insightsController.suggestImprovements);

/**
 * @route POST /competitor-analysis
 * @desc Generate competitor analysis insights
 * @access Private (Premium)
 */
router.post('/', validate(insightSchemas.competitorAnalysis), insightsController.competitorAnalysis);

/**
 * @route POST /market-trends
 * @desc Analyze market trends based on survey data
 * @access Private (Premium)
 */
router.post('/', validate(insightSchemas.marketTrends), insightsController.marketTrends);

module.exports = router; 