const express = require('express');
const router = express.Router();
const {
  generateEmbedCode,
  getEmbedScript,
  getEmbedHtml,
  disableEmbedding
} = require('../controllers/embedController');
const { protect } = require('../middleware/authMiddleware');

// Public routes for embedded surveys
router.get('/script/:token.js', getEmbedScript);
router.get('/:token', getEmbedHtml);

// Protected routes - require authentication
router.post('/generate/:surveyId', protect, generateEmbedCode);
router.delete('/:surveyId', protect, disableEmbedding);

module.exports = router; 