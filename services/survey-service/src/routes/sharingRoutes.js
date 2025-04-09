/**
 * Sharing Routes
 * Defines API routes for survey sharing operations
 */

const express = require('express');
const router = express.Router();
const sharingController = require('../controllers/sharingController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const schemas = require('../utils/validationSchemas');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all shares for a survey
router.get(
  '/:id/shares',
  sharingController.getSurveyShares
);

// Share a survey with a user
router.post(
  '/:id/shares',
  validate(schemas.shareSurveySchema),
  sharingController.shareSurvey
);

// Remove a share
router.delete(
  '/:id/shares/:shareId',
  sharingController.removeSurveyShare
);

// Update share permissions
router.patch(
  '/:id/shares/:shareId',
  validate(schemas.updateShareSchema),
  sharingController.updateSharePermission
);

module.exports = router; 