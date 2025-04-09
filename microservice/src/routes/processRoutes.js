/**
 * Data processing routes
 */
const express = require('express');
const { 
  processData, 
  getProcessedData, 
  getAllProcessedData,
  deleteProcessedData,
  analyzeSentiment,
  findThemes
} = require('../controllers/exampleController');
const { apiKeyAuth } = require('../middleware/authMiddleware');
const {
  validateProcessRequest,
  validatePaginationParams
} = require('../middleware/validation');

const router = express.Router();

// All routes require API key
router.use(apiKeyAuth);

/**
 * @route   POST /api/process
 * @desc    Process data and store results
 * @access  Private (API Key)
 */
router.post('/', validateProcessRequest, processData);

/**
 * @route   GET /api/process/:id
 * @desc    Get processed data by ID
 * @access  Private (API Key)
 */
router.get('/:id', getProcessedData);

/**
 * @route   GET /api/process
 * @desc    Get all processed data
 * @access  Private (API Key)
 */
router.get('/', validatePaginationParams, getAllProcessedData);

/**
 * @route   DELETE /api/process/:id
 * @desc    Delete processed data by ID
 * @access  Private (API Key)
 */
router.delete('/:id', deleteProcessedData);

/**
 * @route   POST /api/process/sentiment
 * @desc    Run sentiment analysis on survey responses
 * @access  Private (API Key)
 */
router.post('/sentiment', validateProcessRequest, analyzeSentiment);

/**
 * @route   POST /api/process/themes
 * @desc    Find themes and patterns in survey responses
 * @access  Private (API Key)
 */
router.post('/themes', validateProcessRequest, findThemes);

module.exports = router; 