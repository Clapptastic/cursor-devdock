const express = require('express');
const router = express.Router();
const {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResponses,
  getPublicSurvey,
  submitSurveyResponse
} = require('../controllers/surveyController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateSurveyMiddleware, validateResponseMiddleware } = require('../middleware/validation');

// Public routes
router.get('/public/:id', getPublicSurvey);
router.post('/:id/respond', validateResponseMiddleware, submitSurveyResponse);

// Protected routes - require authentication
router.route('/')
  .get(protect, getSurveys)
  .post(protect, validateSurveyMiddleware, createSurvey);

router.route('/:id')
  .get(protect, getSurveyById)
  .put(protect, validateSurveyMiddleware, updateSurvey)
  .delete(protect, deleteSurvey);

router.get('/:id/responses', protect, getSurveyResponses);

module.exports = router; 