/**
 * Authentication Routes
 * Handles user registration, login, logout, and token management
 */

const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticate } = require('../middleware/authMiddleware');

// Configuration for auth service proxy
const authServiceProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/'
  },
  logLevel: 'silent'
});

// Public routes - don't require authentication
router.post('/register', authServiceProxy);
router.post('/login', authServiceProxy);
router.post('/forgot-password', authServiceProxy);
router.post('/reset-password', authServiceProxy);

// Protected routes - require authentication
router.use(authenticate);
router.post('/logout', authServiceProxy);
router.get('/me', authServiceProxy);
router.put('/me', authServiceProxy);
router.put('/change-password', authServiceProxy);

module.exports = router; 