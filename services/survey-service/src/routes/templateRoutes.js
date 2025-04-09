/**
 * Template Routes
 * Defines API routes for template operations
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const schemas = require('../utils/validationSchemas');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all templates for the authenticated user
router.get('/', templateController.getUserTemplates);

// Create a new template
router.post(
  '/',
  validate(schemas.createTemplateSchema),
  templateController.createTemplate
);

// Get a template by ID
router.get('/:id', templateController.getTemplate);

// Update a template
router.put(
  '/:id',
  validate(schemas.updateTemplateSchema),
  templateController.updateTemplate
);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

// Create a survey from a template
router.post(
  '/:id/create-survey',
  validate(schemas.createSurveyFromTemplateSchema),
  templateController.createSurveyFromTemplate
);

module.exports = router; 