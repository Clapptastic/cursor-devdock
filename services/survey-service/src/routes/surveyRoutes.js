/**
 * Survey Routes
 * Defines API routes for survey operations
 */

const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const schemas = require('../utils/validationSchemas');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all surveys for the authenticated user
router.get('/', surveyController.getUserSurveys);

// Search surveys
router.get('/search', surveyController.searchSurveys);

// Create a new survey
router.post(
  '/',
  validate(schemas.createSurveySchema),
  surveyController.createSurvey
);

// Get a survey by ID
router.get('/:id', surveyController.getSurvey);

// Update a survey
router.put(
  '/:id',
  validate(schemas.updateSurveySchema),
  surveyController.updateSurvey
);

// Delete a survey
router.delete('/:id', surveyController.deleteSurvey);

// Create a template from an existing survey
router.post(
  '/:id/template',
  validate(schemas.createTemplateSchema),
  surveyController.createTemplate
);

module.exports = router; 