const express = require('express');
const router = express.Router();
const { ApiKey } = require('../models');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Rate limit for security - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all routes
router.use(apiLimiter);

// Middleware to check for API service admin key
const authenticateAdmin = async (req, res, next) => {
  const adminKey = req.headers['x-admin-api-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Admin API key required' });
  }
  
  next();
};

// Get all API keys (admin only, masked)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll({
      attributes: { exclude: ['key'] } // Never return the actual key
    });
    
    // Provide masked keys for admin view
    const maskedApiKeys = apiKeys.map(apiKey => {
      const plainKey = apiKey.get({ plain: true });
      plainKey.maskedKey = apiKey.maskKey();
      return plainKey;
    });
    
    res.json(maskedApiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create a new API key
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, service, expiresAt, metadata } = req.body;
    
    if (!name || !service) {
      return res.status(400).json({ error: 'Name and service are required' });
    }
    
    // Generate a secure random API key
    const newKey = crypto.randomBytes(32).toString('hex');
    
    const apiKey = await ApiKey.create({
      name,
      service,
      key: newKey,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: metadata || {}
    });
    
    // Return the full key only upon creation
    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        service: apiKey.service,
        key: newKey, // Return the key only once during creation
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Verify an API key
router.post('/verify', async (req, res) => {
  try {
    const { service, key } = req.body;
    
    if (!service || !key) {
      return res.status(400).json({ error: 'Service and key are required' });
    }
    
    const apiKey = await ApiKey.verifyKey(service, key);
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    res.json({
      valid: true,
      keyId: apiKey.id,
      service: apiKey.service,
      name: apiKey.name
    });
  } catch (error) {
    console.error('Error verifying API key:', error);
    res.status(500).json({ error: 'Failed to verify API key' });
  }
});

// Deactivate an API key
router.put('/:id/deactivate', authenticateAdmin, async (req, res) => {
  try {
    const apiKey = await ApiKey.findByPk(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await apiKey.update({ isActive: false });
    
    res.json({
      message: 'API key deactivated successfully',
      id: apiKey.id
    });
  } catch (error) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

// Reactivate an API key
router.put('/:id/activate', authenticateAdmin, async (req, res) => {
  try {
    const apiKey = await ApiKey.findByPk(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await apiKey.update({ isActive: true });
    
    res.json({
      message: 'API key activated successfully',
      id: apiKey.id
    });
  } catch (error) {
    console.error('Error activating API key:', error);
    res.status(500).json({ error: 'Failed to activate API key' });
  }
});

// Delete an API key
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const apiKey = await ApiKey.findByPk(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await apiKey.destroy();
    
    res.json({
      message: 'API key deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get usage stats for an API key
router.get('/:id/stats', authenticateAdmin, async (req, res) => {
  try {
    const apiKey = await ApiKey.findByPk(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({
      id: apiKey.id,
      name: apiKey.name,
      service: apiKey.service,
      usageCount: apiKey.usageCount,
      lastUsed: apiKey.lastUsed,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt
    });
  } catch (error) {
    console.error('Error fetching API key stats:', error);
    res.status(500).json({ error: 'Failed to fetch API key stats' });
  }
});

// Get API key for a service by name
router.get('/service/:service/key/:name', authenticateAdmin, async (req, res) => {
  try {
    const { service, name } = req.params;
    
    const apiKey = await ApiKey.findOne({
      where: {
        service,
        name
      },
      attributes: { exclude: ['key'] }
    });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    const plainKey = apiKey.get({ plain: true });
    plainKey.maskedKey = apiKey.maskKey();
    
    res.json(plainKey);
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

module.exports = router; 