/**
 * Routes Index
 * Centralizes all routes for the AI service
 */

const express = require('express');
const router = express.Router();

// Import route modules
const questionRoutes = require('./questionRoutes');
const analysisRoutes = require('./analysisRoutes');
const insightsRoutes = require('./insightsRoutes');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AI Service is operational',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/', questionRoutes);
router.use('/', analysisRoutes);
router.use('/', insightsRoutes);

// 404 handler for unrecognized routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.originalUrl}`
    }
  });
});

module.exports = router; 