/**
 * Template Routes
 * Handles operations related to survey templates
 */

const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Configuration for template service proxy
const templateServiceProxy = createProxyMiddleware({
  target: process.env.TEMPLATE_SERVICE_URL || 'http://template-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/templates': '/'
  },
  logLevel: 'silent'
});

// All template routes require authentication
router.use(authenticate);

// Public templates - accessible to all authenticated users
router.get('/', templateServiceProxy);
router.get('/public', templateServiceProxy);
router.get('/:id', templateServiceProxy);
router.get('/:id/questions', templateServiceProxy);

// Create, update, delete - require appropriate authorization
router.post('/', authorize(['admin', 'user']), templateServiceProxy);
router.put('/:id', authorize(['admin', 'user']), templateServiceProxy);
router.delete('/:id', authorize(['admin', 'user']), templateServiceProxy);

// Template questions management
router.post('/:id/questions', authorize(['admin', 'user']), templateServiceProxy);
router.put('/:id/questions/:questionId', authorize(['admin', 'user']), templateServiceProxy);
router.delete('/:id/questions/:questionId', authorize(['admin', 'user']), templateServiceProxy);
router.post('/:id/questions/reorder', authorize(['admin', 'user']), templateServiceProxy);

// Template categories, industry and business stage mapping
router.get('/categories', templateServiceProxy);
router.get('/industries', templateServiceProxy);
router.get('/business-stages', templateServiceProxy);
router.get('/customer-segments', templateServiceProxy);

module.exports = router; 