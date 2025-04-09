/**
 * Database migration runner
 * Executes migrations in order based on their timestamps
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Get the migration direction from command line arguments
const direction = process.argv[2] || 'up';
const specificMigration = process.argv[3];

// Validate the migration direction
if (direction !== 'up' && direction !== 'down') {
  console.error('Invalid migration direction. Use "up" or "down".');
  process.exit(1);
}

/**
 * Get all migration files in the migrations directory
 * @returns {Array<string>} List of migration file names
 */
const getMigrationFiles = () => {
  const migrationsDir = __dirname;
  
  return fs.readdirSync(migrationsDir)
    .filter(file => {
      // Only include .js files that aren't the runner or in the sql directory
      return file.endsWith('.js') && 
             file !== 'runner.js' && 
             !file.startsWith('.');
    })
    .sort(); // Sort in ascending order by filename
};

/**
 * Run migrations in specified direction
 * @param {string} direction Migration direction ('up' or 'down')
 * @param {string} specificMigration Optional specific migration to run
 */
const runMigrations = async (direction, specificMigration = null) => {
  const migrationFiles = getMigrationFiles();
  
  // If a specific migration is provided, only run that one
  const migrationsToRun = specificMigration 
    ? migrationFiles.filter(file => file === specificMigration || file.startsWith(specificMigration))
    : migrationFiles;
    
  if (migrationsToRun.length === 0) {
    console.error(`No migrations found${specificMigration ? ` matching "${specificMigration}"` : ''}.`);
    process.exit(1);
  }
  
  // If direction is down, reverse the order of migrations
  if (direction === 'down') {
    migrationsToRun.reverse();
  }
  
  console.log(`Running ${direction} migrations for ${migrationsToRun.length} files...`);
  
  // Run each migration sequentially
  for (const file of migrationsToRun) {
    try {
      const migrationPath = path.join(__dirname, file);
      const migration = require(migrationPath);
      
      if (typeof migration[direction] !== 'function') {
        console.error(`Migration ${file} does not have a ${direction} function.`);
        continue;
      }
      
      console.log(`Running migration: ${file} (${direction})`);
      await migration[direction]();
      console.log(`Completed migration: ${file} (${direction})`);
    } catch (error) {
      console.error(`Error running migration ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log(`Migration complete. Ran ${migrationsToRun.length} migrations.`);
};

// Execute migrations
runMigrations(direction, specificMigration)
  .then(() => {
    console.log('All migrations completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration runner failed:', error);
    process.exit(1);
  }); 