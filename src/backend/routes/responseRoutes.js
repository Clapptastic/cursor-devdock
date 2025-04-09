const express = require('express');
const router = express.Router();
const {
  getResponses,
  getResponseById,
  deleteResponse,
  exportResponses
} = require('../controllers/responseController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.route('/')
  .get(protect, admin, getResponses);

router.route('/export/:surveyId')
  .get(protect, exportResponses);

router.route('/:id')
  .get(protect, getResponseById)
  .delete(protect, admin, deleteResponse);

module.exports = router; 