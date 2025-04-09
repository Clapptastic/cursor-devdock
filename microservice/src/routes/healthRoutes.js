/**
 * Health check routes
 */
const express = require('express');
const { getHealth, getReady } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Get service health status
 * @access  Public
 */
router.get('/', getHealth);

/**
 * @route   GET /ready
 * @desc    Get service ready status (for liveness probe)
 * @access  Public
 */
router.get('/ready', getReady);

module.exports = router; 