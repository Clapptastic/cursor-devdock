const express = require('express');
const router = express.Router();
const {
  createSharingLink,
  getSurveyByToken,
  revokeSharingLink
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Public route to access shared survey
router.get('/:token', getSurveyByToken);

// Protected routes - require authentication
router.post('/create/:surveyId', protect, createSharingLink);
router.delete('/:surveyId', protect, revokeSharingLink);

module.exports = router; 