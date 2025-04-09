/**
 * Scheduled database backup script
 * Can be used with cron jobs or other schedulers to automate backups
 */
const fs = require('fs');
const path = require('path');
const { createBackup, listBackups } = require('./backup');

// Default backup settings
const DEFAULT_RETENTION_DAYS = 7;
const DEFAULT_MAX_BACKUPS = 10;

/**
 * Execute a scheduled backup with cleanup
 * @param {Object} options - Backup options
 * @param {number} options.retentionDays - Number of days to keep backups (default: 7)
 * @param {number} options.maxBackups - Maximum number of backups to keep (default: 10)
 * @param {string} options.outputDir - Custom backup directory (optional)
 * @param {boolean} options.gzip - Whether to use gzip compression (default: true)
 * @returns {Promise<string>} Path to the created backup
 */
const runScheduledBackup = async (options = {}) => {
  console.log('Starting scheduled database backup...');
  
  // Set default options
  const retentionDays = options.retentionDays || DEFAULT_RETENTION_DAYS;
  const maxBackups = options.maxBackups || DEFAULT_MAX_BACKUPS;
  
  try {
    // Create a new backup
    const backupPath = await createBackup({
      outputDir: options.outputDir,
      gzip: options.gzip !== false
    });
    
    console.log(`Backup created successfully: ${backupPath}`);
    
    // Clean up old backups
    await cleanupOldBackups({
      retentionDays,
      maxBackups,
      directory: options.outputDir
    });
    
    return backupPath;
  } catch (error) {
    console.error('Scheduled backup failed:', error.message);
    throw error;
  }
};

/**
 * Clean up old backups based on retention policy
 * @param {Object} options - Cleanup options
 * @param {number} options.retentionDays - Number of days to keep backups
 * @param {number} options.maxBackups - Maximum number of backups to keep
 * @param {string} options.directory - Backup directory to clean
 * @returns {Promise<number>} Number of backups deleted
 */
const cleanupOldBackups = async (options = {}) => {
  const { retentionDays, maxBackups, directory } = options;
  
  console.log(`Cleaning up old backups (retention: ${retentionDays} days, max: ${maxBackups} backups)...`);
  
  try {
    // Get list of all backups
    const backups = listBackups(directory);
    
    if (backups.length <= maxBackups) {
      console.log(`No cleanup needed, only ${backups.length} backups exist (max: ${maxBackups})`);
      return 0;
    }
    
    // Calculate retention date
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);
    
    // Determine which backups to delete
    const backupsToDelete = backups.filter((backup, index) => {
      // Keep backups within retention period
      if (new Date(backup.created) >= retentionDate) {
        return false;
      }
      
      // Always keep the newest maxBackups
      if (index < maxBackups) {
        return false;
      }
      
      return true;
    });
    
    if (backupsToDelete.length === 0) {
      console.log('No backups found that meet deletion criteria');
      return 0;
    }
    
    console.log(`Found ${backupsToDelete.length} backups to delete`);
    
    // Delete the old backups
    for (const backup of backupsToDelete) {
      console.log(`Deleting backup: ${backup.name}`);
      
      if (backup.isDirectory) {
        // If it's a directory, recursively delete it
        fs.rmSync(backup.path, { recursive: true, force: true });
      } else {
        // If it's a file, simply unlink it
        fs.unlinkSync(backup.path);
      }
    }
    
    console.log(`Deleted ${backupsToDelete.length} old backups`);
    return backupsToDelete.length;
  } catch (error) {
    console.error('Backup cleanup failed:', error.message);
    throw error;
  }
};

/**
 * Parse command line arguments and run the scheduled backup
 */
const main = async () => {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    retentionDays: DEFAULT_RETENTION_DAYS,
    maxBackups: DEFAULT_MAX_BACKUPS,
    gzip: true
  };
  
  // Process arguments
  for (const arg of args) {
    if (arg.startsWith('--retention=')) {
      options.retentionDays = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--max=')) {
      options.maxBackups = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg === '--no-gzip') {
      options.gzip = false;
    } else if (arg.startsWith('--')) {
      console.warn(`Unknown option: ${arg}`);
    }
  }
  
  try {
    await runScheduledBackup(options);
    console.log('Scheduled backup completed successfully');
  } catch (error) {
    console.error('Scheduled backup failed:', error);
    process.exit(1);
  }
};

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runScheduledBackup,
  cleanupOldBackups
}; 