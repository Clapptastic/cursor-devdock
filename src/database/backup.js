/**
 * Database backup/restore utility
 * Provides functions to backup and restore MongoDB database
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Default backup directory
const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Get MongoDB connection URI from environment variables
 * @returns {string} MongoDB URI
 */
const getMongoUri = () => {
  // Get connection parameters from environment variables
  const uri = process.env.MONGO_URI;
  if (uri) return uri;
  
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DB || 'customer-survey';
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  
  // Build URI string based on available credentials
  if (user && pass) {
    return `mongodb://${user}:${pass}@${host}:${port}/${db}`;
  }
  
  return `mongodb://${host}:${port}/${db}`;
};

/**
 * Extract database name from MongoDB URI
 * @param {string} uri - MongoDB URI
 * @returns {string} Database name
 */
const getDatabaseName = (uri) => {
  try {
    // Extract database name from URI
    const matches = uri.match(/\/([^/]+)(?:\?|$)/);
    return matches && matches[1] ? matches[1] : 'customer-survey';
  } catch (error) {
    return 'customer-survey';
  }
};

/**
 * Ensure backup directory exists
 * @param {string} dir - Directory path
 */
const ensureBackupDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created backup directory: ${dir}`);
  }
};

/**
 * Create a backup of the MongoDB database
 * @param {Object} options - Backup options
 * @param {string} options.uri - MongoDB URI (optional, will use env vars if not provided)
 * @param {string} options.outputDir - Output directory (optional)
 * @param {boolean} options.gzip - Whether to compress the backup (default: true)
 * @returns {Promise<string>} Path to the backup file
 */
const createBackup = async (options = {}) => {
  const uri = options.uri || getMongoUri();
  const dbName = getDatabaseName(uri);
  const outputDir = options.outputDir || BACKUP_DIR;
  const gzip = options.gzip !== false; // Default to true
  
  // Create backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(outputDir, `${dbName}_${timestamp}${gzip ? '.gz' : ''}`);
  
  // Ensure backup directory exists
  ensureBackupDirectory(outputDir);
  
  // Build mongodump command arguments
  const args = ['--uri', uri, '--out', outputDir, '--db', dbName];
  
  if (gzip) {
    args.push('--gzip');
  }
  
  // Log start of backup process
  console.log(`Starting backup of database: ${dbName}`);
  console.log(`Output file: ${outputFile}`);
  
  try {
    // Execute mongodump command
    await new Promise((resolve, reject) => {
      const mongodump = spawn('mongodump', args);
      
      let stderr = '';
      
      mongodump.stdout.on('data', (data) => {
        // Process stdout if needed
      });
      
      mongodump.stderr.on('data', (data) => {
        // Collect stderr output
        stderr += data.toString();
      });
      
      mongodump.on('close', (code) => {
        if (code === 0) {
          console.log('Backup completed successfully');
          resolve();
        } else {
          reject(new Error(`mongodump exited with code ${code}: ${stderr}`));
        }
      });
      
      mongodump.on('error', (err) => {
        reject(new Error(`Failed to start mongodump: ${err.message}`));
      });
    });
    
    // Rename the output directory to the desired filename
    const backupDbDir = path.join(outputDir, dbName);
    
    // If the backup exists and it's not already the expected output file
    if (fs.existsSync(backupDbDir) && backupDbDir !== outputFile) {
      fs.renameSync(backupDbDir, outputFile);
    }
    
    console.log(`Backup saved to: ${outputFile}`);
    return outputFile;
  } catch (error) {
    console.error('Backup failed:', error.message);
    throw error;
  }
};

/**
 * Restore a MongoDB database from backup
 * @param {Object} options - Restore options
 * @param {string} options.backupPath - Path to backup file or directory
 * @param {string} options.uri - MongoDB URI (optional, will use env vars if not provided)
 * @param {boolean} options.drop - Whether to drop collections before restore (default: false)
 * @returns {Promise<void>} Promise that resolves when restore is complete
 */
const restoreBackup = async (options = {}) => {
  if (!options.backupPath) {
    throw new Error('Backup path is required');
  }
  
  const backupPath = options.backupPath;
  const uri = options.uri || getMongoUri();
  const dbName = getDatabaseName(uri);
  const drop = options.drop === true; // Default to false
  
  // Check if backup path exists
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup path does not exist: ${backupPath}`);
  }
  
  // Build mongorestore command arguments
  const args = ['--uri', uri, '--db', dbName];
  
  if (drop) {
    args.push('--drop');
  }
  
  // Check if the backup path is a directory or file
  const isDirectory = fs.statSync(backupPath).isDirectory();
  
  if (isDirectory) {
    // If it's a directory, add it as the source
    args.push(backupPath);
  } else {
    // If it's a file, add --archive option
    args.push('--archive=' + backupPath);
    
    // Check if it's gzipped
    if (backupPath.endsWith('.gz')) {
      args.push('--gzip');
    }
  }
  
  // Log start of restore process
  console.log(`Starting restore of database: ${dbName}`);
  console.log(`Source: ${backupPath}`);
  
  try {
    // Execute mongorestore command
    await new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', args);
      
      let stderr = '';
      
      mongorestore.stdout.on('data', (data) => {
        // Process stdout if needed
      });
      
      mongorestore.stderr.on('data', (data) => {
        // Collect stderr output
        stderr += data.toString();
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          console.log('Restore completed successfully');
          resolve();
        } else {
          reject(new Error(`mongorestore exited with code ${code}: ${stderr}`));
        }
      });
      
      mongorestore.on('error', (err) => {
        reject(new Error(`Failed to start mongorestore: ${err.message}`));
      });
    });
    
    console.log(`Database ${dbName} restored successfully`);
  } catch (error) {
    console.error('Restore failed:', error.message);
    throw error;
  }
};

/**
 * List available backups
 * @param {string} directory - Directory to scan for backups (optional)
 * @returns {Array<Object>} Array of backup information objects
 */
const listBackups = (directory = BACKUP_DIR) => {
  // Ensure backup directory exists
  ensureBackupDirectory(directory);
  
  try {
    // Get a list of all files in the backup directory
    const files = fs.readdirSync(directory);
    
    // Filter and map to get backup information
    return files
      .filter(file => {
        const fullPath = path.join(directory, file);
        // Filter for files or directories that look like backups
        const isDir = fs.statSync(fullPath).isDirectory();
        return isDir || file.includes('_') || file.endsWith('.gz');
      })
      .map(file => {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);
        
        // Extract database name from filename
        let dbName = 'unknown';
        if (file.includes('_')) {
          dbName = file.split('_')[0];
        } else if (stats.isDirectory()) {
          dbName = file;
        }
        
        // Get date from filename or directory stats
        let timestamp;
        if (file.includes('_')) {
          // Extract timestamp from filename format dbname_timestamp.gz
          const datePart = file.split('_')[1].split('.')[0];
          try {
            // Try to parse the ISO date string
            timestamp = datePart.replace(/-/g, (i, idx) => {
              if (idx === 10) return 'T';
              if (idx === 13 || idx === 16) return ':';
              return '-';
            });
          } catch (e) {
            // If parsing fails, use file creation time
            timestamp = stats.birthtime.toISOString();
          }
        } else {
          // Use file/directory creation time
          timestamp = stats.birthtime.toISOString();
        }
        
        return {
          name: file,
          path: fullPath,
          database: dbName,
          timestamp,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          created: stats.birthtime
        };
      })
      .sort((a, b) => {
        // Sort by creation date, newest first
        return new Date(b.created) - new Date(a.created);
      });
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return [];
  }
};

/**
 * Parse command-line arguments and execute appropriate action
 */
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      // Example: node backup.js create --output=/custom/path --no-gzip
      try {
        const outputOption = args.find(arg => arg.startsWith('--output='));
        const outputDir = outputOption ? outputOption.split('=')[1] : null;
        const noGzip = args.includes('--no-gzip');
        
        await createBackup({
          outputDir,
          gzip: !noGzip
        });
      } catch (error) {
        console.error('Failed to create backup:', error.message);
        process.exit(1);
      }
      break;
      
    case 'restore':
      // Example: node backup.js restore --path=/path/to/backup --drop
      try {
        const pathOption = args.find(arg => arg.startsWith('--path='));
        
        if (!pathOption) {
          console.error('--path option is required for restore');
          process.exit(1);
        }
        
        const backupPath = pathOption.split('=')[1];
        const drop = args.includes('--drop');
        
        await restoreBackup({
          backupPath,
          drop
        });
      } catch (error) {
        console.error('Failed to restore backup:', error.message);
        process.exit(1);
      }
      break;
      
    case 'list':
      // Example: node backup.js list --dir=/custom/backup/dir
      try {
        const dirOption = args.find(arg => arg.startsWith('--dir='));
        const directory = dirOption ? dirOption.split('=')[1] : null;
        
        const backups = listBackups(directory);
        
        if (backups.length === 0) {
          console.log('No backups found');
        } else {
          console.log(`Found ${backups.length} backups:`);
          backups.forEach((backup, index) => {
            console.log(
              `${index + 1}. ${backup.name} - ${backup.database} - ` +
              `${new Date(backup.created).toLocaleString()} - ` +
              `${(backup.size / (1024 * 1024)).toFixed(2)} MB`
            );
          });
        }
      } catch (error) {
        console.error('Failed to list backups:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log(`
Database Backup Utility

Usage:
  node backup.js create [--output=/path/to/dir] [--no-gzip]
  node backup.js restore --path=/path/to/backup [--drop]
  node backup.js list [--dir=/path/to/dir]

Options:
  --output=PATH     Specify output directory for backup
  --no-gzip         Disable gzip compression for backup
  --path=PATH       Specify backup file/directory to restore
  --drop            Drop collections before restore
  --dir=PATH        Specify directory to look for backups
      `);
      break;
  }
};

// Run main function if script is run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  getMongoUri,
  getDatabaseName
}; 