/**
 * Survey analysis routes
 */
const express = require('express');
const { 
  generateInsights,
  generateHeatmap,
  analyzeTrends,
  generateNextSteps
} = require('../controllers/analysisController');
const { apiKeyAuth } = require('../middleware/authMiddleware');
const { 
  validateProcessRequest,
  validateTrendsRequest
} = require('../middleware/validation');

const router = express.Router();

// All routes require API key
router.use(apiKeyAuth);

/**
 * @route   POST /api/analysis/insights
 * @desc    Generate insights from survey responses
 * @access  Private (API Key)
 */
router.post('/insights', validateProcessRequest, generateInsights);

/**
 * @route   POST /api/analysis/heatmap
 * @desc    Generate heatmap data for survey responses
 * @access  Private (API Key)
 */
router.post('/heatmap', validateProcessRequest, generateHeatmap);

/**
 * @route   POST /api/analysis/trends
 * @desc    Compare survey responses over time
 * @access  Private (API Key)
 */
router.post('/trends', validateTrendsRequest, analyzeTrends);

/**
 * @route   POST /api/analysis/next-steps
 * @desc    Generate next steps based on survey responses
 * @access  Private (API Key)
 */
router.post('/next-steps', validateProcessRequest, generateNextSteps);

module.exports = router; 