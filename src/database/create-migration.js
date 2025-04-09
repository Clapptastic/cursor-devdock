/**
 * Migration file generator
 * Creates new migration files with the correct structure
 */
const fs = require('fs');
const path = require('path');

// Get migration name from command line
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name');
  console.error('Usage: npm run db:create-migration migration_name');
  process.exit(1);
}

// Create timestamp for migration filename
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
const filename = `${timestamp}_${migrationName.toLowerCase().replace(/\s+/g, '_')}.js`;

// Migration file template
const template = `/**
 * Migration: ${migrationName}
 * Created at: ${new Date().toISOString()}
 */
const { getDB } = require('../../backend/config/database');

/**
 * Apply the migration
 */
async function up() {
  const supabase = getDB();
  
  try {
    console.log('Running migration: ${migrationName} (up)');
    
    // TODO: Add your migration code here
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Revert the migration
 */
async function down() {
  const supabase = getDB();
  
  try {
    console.log('Rolling back migration: ${migrationName}');
    
    // TODO: Add your rollback code here
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
};
`;

// Write the migration file
const migrationsDir = path.join(__dirname, 'migrations');
const filePath = path.join(migrationsDir, filename);

try {
  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Create SQL directory if it doesn't exist
  const sqlDir = path.join(migrationsDir, 'sql');
  if (!fs.existsSync(sqlDir)) {
    fs.mkdirSync(sqlDir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(filePath, template);
  console.log(`Migration file created: ${filePath}`);
} catch (error) {
  console.error('Error creating migration file:', error);
  process.exit(1);
} 