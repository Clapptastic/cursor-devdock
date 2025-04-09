/**
 * API Gateway Routes Index
 * Central file to organize all route imports and exports
 */

const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./authRoutes');
const templateRoutes = require('./templateRoutes');
const surveyRoutes = require('./surveyRoutes');
const responseRoutes = require('./responseRoutes');
const analysisRoutes = require('./analysisRoutes');
const aiRoutes = require('./aiRoutes');
const integrationRoutes = require('./integrationRoutes');
const exportRoutes = require('./exportRoutes');
const notificationRoutes = require('./notificationRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Gateway is operational',
    timestamp: new Date().toISOString()
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/surveys', surveyRoutes);
router.use('/responses', responseRoutes);
router.use('/analysis', analysisRoutes);
router.use('/ai', aiRoutes);
router.use('/integrations', integrationRoutes);
router.use('/exports', exportRoutes);
router.use('/notifications', notificationRoutes);

// Documentation redirect
router.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

module.exports = router; 