/**
 * Database health check routes
 */
const express = require('express');
const { checkHealth } = require('../config/database');
const router = express.Router();

/**
 * @route   GET /api/db/health
 * @desc    Get database connection status
 * @access  Private (Admin only)
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await checkHealth();
    
    return res.json({
      success: true,
      status: {
        connected: isHealthy,
        healthy: isHealthy,
        message: isHealthy ? 'Connected to Supabase' : 'Failed to connect to Supabase',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/db/stats
 * @desc    Get database statistics
 * @access  Private (Admin only)
 */
router.get('/stats', async (req, res) => {
  try {
    const supabase = require('../config/database').getDB();
    
    // Get tables information
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_stats');
    
    if (tableError) throw tableError;
    
    // Format the response
    const stats = {
      tables: tableInfo || [],
      serverTime: new Date().toISOString(),
      provider: 'Supabase'
    };
    
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 