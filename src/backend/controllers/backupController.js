/**
 * Database backup controller
 * Handles API requests for database backup operations
 */
const {
  createBackup,
  restoreBackup,
  listBackups
} = require('../../database/backup');
const { runScheduledBackup } = require('../../database/scheduleBackup');

/**
 * Get all backups
 * @route GET /api/backups
 * @access Private (Admin only)
 */
const getBackups = async (req, res) => {
  try {
    // Optional custom directory from query params
    const directory = req.query.directory;
    
    // Get all backups
    const backups = listBackups(directory);
    
    // Return formatted backup info
    return res.json({
      success: true,
      count: backups.length,
      data: backups.map(backup => ({
        name: backup.name,
        database: backup.database,
        timestamp: backup.timestamp,
        created: backup.created,
        size: backup.size,
        sizeFormatted: `${(backup.size / (1024 * 1024)).toFixed(2)} MB`,
        path: backup.path,
        isDirectory: backup.isDirectory
      }))
    });
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error listing backups',
      message: error.message
    });
  }
};

/**
 * Create a new backup
 * @route POST /api/backups
 * @access Private (Admin only)
 */
const createNewBackup = async (req, res) => {
  try {
    // Get options from request body
    const { outputDir, gzip = true } = req.body;
    
    // Create backup
    const backupPath = await createBackup({ outputDir, gzip });
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: {
        path: backupPath
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error creating backup',
      message: error.message
    });
  }
};

/**
 * Restore from a backup
 * @route POST /api/backups/restore
 * @access Private (Admin only)
 */
const restoreFromBackup = async (req, res) => {
  try {
    // Get backup path and options from request body
    const { backupPath, drop = false } = req.body;
    
    // Validate backup path
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        error: 'Backup path is required'
      });
    }
    
    // Restore from backup
    await restoreBackup({ backupPath, drop });
    
    // Return success response
    return res.json({
      success: true,
      message: 'Database restored successfully'
    });
  } catch (error) {
    console.error('Error restoring backup:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error restoring backup',
      message: error.message
    });
  }
};

/**
 * Run a scheduled backup with cleanup
 * @route POST /api/backups/scheduled
 * @access Private (Admin only)
 */
const runScheduled = async (req, res) => {
  try {
    // Get options from request body
    const {
      retentionDays = 7,
      maxBackups = 10,
      outputDir,
      gzip = true
    } = req.body;
    
    // Run scheduled backup
    const backupPath = await runScheduledBackup({
      retentionDays,
      maxBackups,
      outputDir,
      gzip
    });
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Scheduled backup completed successfully',
      data: {
        path: backupPath
      }
    });
  } catch (error) {
    console.error('Error running scheduled backup:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error running scheduled backup',
      message: error.message
    });
  }
};

/**
 * Delete a backup
 * @route DELETE /api/backups/:name
 * @access Private (Admin only)
 */
const deleteBackup = async (req, res) => {
  try {
    // Get backup name from route params
    const { name } = req.params;
    
    // Optional custom directory from query params
    const directory = req.query.directory;
    
    // Get all backups
    const backups = listBackups(directory);
    
    // Find the backup to delete
    const backupToDelete = backups.find(backup => backup.name === name);
    
    // Check if backup exists
    if (!backupToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }
    
    // Delete the backup
    if (backupToDelete.isDirectory) {
      // If it's a directory, recursively delete it
      require('fs').rmSync(backupToDelete.path, { recursive: true, force: true });
    } else {
      // If it's a file, simply unlink it
      require('fs').unlinkSync(backupToDelete.path);
    }
    
    // Return success response
    return res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error deleting backup',
      message: error.message
    });
  }
};

module.exports = {
  getBackups,
  createNewBackup,
  restoreFromBackup,
  runScheduled,
  deleteBackup
}; 