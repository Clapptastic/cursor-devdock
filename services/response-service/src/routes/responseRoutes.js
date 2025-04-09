/**
 * Response Routes
 * Defines API routes for survey response operations
 */

const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const schemas = require('../utils/validationSchemas');

// Public routes - allow anonymous responses
// Submit response for a survey
router.post(
  '/surveys/:surveyId/responses',
  optionalAuthenticate,
  validate(schemas.createResponseSchema),
  responseController.createResponse
);

// Protected routes - require authentication
// Get a response by ID
router.get(
  '/responses/:id',
  authenticate,
  responseController.getResponseById
);

// Get all responses for a survey
router.get(
  '/surveys/:surveyId/responses',
  authenticate,
  validate(schemas.responseFiltersSchema, 'query'),
  responseController.getResponsesBySurveyId
);

// Update a response
router.put(
  '/responses/:id',
  authenticate,
  validate(schemas.updateResponseSchema),
  responseController.updateResponse
);

// Delete a response
router.delete(
  '/responses/:id',
  authenticate,
  responseController.deleteResponse
);

// Get analytics for a survey
router.get(
  '/surveys/:surveyId/analytics',
  authenticate,
  responseController.getResponseAnalytics
);

module.exports = router; 