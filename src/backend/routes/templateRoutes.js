const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  cloneTemplate
} = require('../controllers/templateController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateTemplateMiddleware } = require('../middleware/validation');

// Protected routes - require authentication
router.route('/')
  .get(protect, getTemplates)
  .post(protect, validateTemplateMiddleware, createTemplate);

router.route('/categories')
  .get(protect, getTemplateCategories);

router.route('/:id')
  .get(protect, getTemplateById)
  .put(protect, validateTemplateMiddleware, updateTemplate)
  .delete(protect, deleteTemplate);

router.route('/:id/clone')
  .post(protect, cloneTemplate);

module.exports = router; 