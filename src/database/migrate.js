/**
 * Database migration runner
 * Runs migrations to set up or update the database structure
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/customer-survey');
    console.log(`Migration runner connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};

// Get all migration files from the migrations directory
const getMigrationFiles = () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory does not exist');
    process.exit(1);
  }
  
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort(); // Ensure migrations run in order
};

// Get applied migrations from the database
const getAppliedMigrations = async (db) => {
  // Create migrations collection if it doesn't exist
  const collections = await db.listCollections({ name: 'migrations' }).toArray();
  if (!collections.length) {
    await db.createCollection('migrations');
    return [];
  }
  
  // Get all applied migrations
  return await db.collection('migrations')
    .find({})
    .sort({ version: 1 })
    .toArray();
};

// Run migrations
const runMigrations = async () => {
  const connection = await connectDB();
  const db = connection.connection.db;
  
  try {
    // Get migration files and already applied migrations
    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(db);
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    // Check for pending migrations
    const pendingMigrations = migrationFiles.filter(file => {
      const version = file.split('_')[0];
      return !appliedVersions.has(version);
    });
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations to apply');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migration(s)...`);
    
    // Run each pending migration
    for (const file of pendingMigrations) {
      const migrationPath = path.join(__dirname, 'migrations', file);
      const migration = require(migrationPath);
      
      console.log(`Running migration: ${file}`);
      const success = await migration.up();
      
      if (!success) {
        console.error(`Migration failed: ${file}`);
        process.exit(1);
      }
      
      console.log(`Successfully applied migration: ${file}`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error(`Migration error: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Rollback the last migration
const rollbackLastMigration = async () => {
  const connection = await connectDB();
  const db = connection.connection.db;
  
  try {
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(db);
    
    if (appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    // Get the last applied migration
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    
    // Find the migration file
    const migrationFiles = getMigrationFiles();
    const migrationFile = migrationFiles.find(file => file.startsWith(lastMigration.version));
    
    if (!migrationFile) {
      console.error(`Migration file for version ${lastMigration.version} not found`);
      process.exit(1);
    }
    
    // Run the down method of the migration
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const migration = require(migrationPath);
    
    console.log(`Rolling back migration: ${migrationFile}`);
    const success = await migration.down();
    
    if (!success) {
      console.error(`Rollback failed: ${migrationFile}`);
      process.exit(1);
    }
    
    console.log(`Successfully rolled back migration: ${migrationFile}`);
  } catch (error) {
    console.error(`Rollback error: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';
  
  switch (command) {
    case 'up':
      await runMigrations();
      break;
    case 'down':
      await rollbackLastMigration();
      break;
    default:
      console.error('Invalid command. Use "up" to migrate or "down" to rollback');
      process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMigrations, rollbackLastMigration }; 