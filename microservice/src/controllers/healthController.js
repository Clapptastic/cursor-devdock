/**
 * Health check controller for microservice
 * Provides endpoints for checking service health
 */
const asyncHandler = require('../middleware/asyncHandler');
const { checkHealth } = require('../config/database');
const os = require('os');

/**
 * @desc    Get service health status
 * @route   GET /health
 * @access  Public
 */
const getHealth = asyncHandler(async (req, res) => {
  const dbHealthy = await checkHealth();
  
  // Get system information
  const systemInfo = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpus: os.cpus().length,
    hostname: os.hostname(),
    platform: process.platform,
    nodeVersion: process.version
  };
  
  // Build the health status response
  const health = {
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'microservice',
    version: process.env.npm_package_version || '1.0.0',
    database: {
      connected: dbHealthy,
      status: dbHealthy ? 'ok' : 'error'
    },
    system: systemInfo
  };
  
  // Set appropriate status code based on health
  const statusCode = dbHealthy ? 200 : 503;
  
  res.status(statusCode).json(health);
});

/**
 * @desc    Get service ready status (liveness probe)
 * @route   GET /ready
 * @access  Public
 */
const getReady = asyncHandler(async (req, res) => {
  // This endpoint always returns 200 if the service is running
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  getHealth,
  getReady
}; 