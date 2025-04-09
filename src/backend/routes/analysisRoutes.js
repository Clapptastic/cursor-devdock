const express = require('express');
const router = express.Router();
const {
  getSurveyAnalysis,
  getAllAnalyses,
  getAnalysisById
} = require('../controllers/analysisController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.route('/')
  .get(protect, getAllAnalyses);

router.route('/survey/:id')
  .get(protect, getSurveyAnalysis);

router.route('/:id')
  .get(protect, getAnalysisById);

module.exports = router; 