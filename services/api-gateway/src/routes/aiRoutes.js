/**
 * AI Service Routes
 * Handles operations related to AI-powered features
 */

const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Configuration for AI service proxy
const aiServiceProxy = createProxyMiddleware({
  target: process.env.AI_SERVICE_URL || 'http://ai-service:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/ai': '/'
  },
  logLevel: 'silent'
});

// All AI routes require authentication
router.use(authenticate);

// Question generation routes
router.post('/generate-questions', aiServiceProxy);
router.post('/improve-question', aiServiceProxy);
router.post('/translate-survey', aiServiceProxy);

// Analysis routes
router.post('/analyze-responses', aiServiceProxy);
router.post('/generate-insights', aiServiceProxy);
router.post('/suggest-improvements', aiServiceProxy);
router.post('/extract-themes', aiServiceProxy);
router.post('/sentiment-analysis', aiServiceProxy);

// Advanced features - may require higher tier subscription
router.post('/competitor-analysis', authorize(['admin', 'premium']), aiServiceProxy);
router.post('/market-trends', authorize(['admin', 'premium']), aiServiceProxy);
router.post('/customer-segmentation', authorize(['admin', 'premium']), aiServiceProxy);

module.exports = router; 