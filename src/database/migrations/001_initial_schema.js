/**
 * Initial database migration script
 * Creates collections and indexes for the application
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Migration metadata
const migrationInfo = {
  version: '001',
  name: 'initial_schema',
  description: 'Create initial collections and indexes'
};

// Run migration
const up = async () => {
  try {
    // Connect to database
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/customer-survey');
    console.log(`Migration connected to MongoDB: ${conn.connection.host}`);
    
    const db = mongoose.connection.db;
    
    // Create collections explicitly
    console.log('Creating collections...');
    await db.createCollection('users');
    await db.createCollection('surveys');
    await db.createCollection('responses');
    await db.createCollection('templates');
    await db.createCollection('analyses');
    
    // Create migration tracking collection if it doesn't exist
    if (!(await db.listCollections({ name: 'migrations' }).toArray()).length) {
      await db.createCollection('migrations');
    }
    
    // Create indexes
    console.log('Creating indexes...');
    
    // Users collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Surveys collection
    await db.collection('surveys').createIndex({ title: 'text', description: 'text' });
    await db.collection('surveys').createIndex({ createdBy: 1 });
    await db.collection('surveys').createIndex({ status: 1 });
    
    // Responses collection
    await db.collection('responses').createIndex({ survey: 1 });
    await db.collection('responses').createIndex({ respondent: 1 });
    
    // Templates collection
    await db.collection('templates').createIndex({ name: 'text', description: 'text', category: 'text', tags: 'text' });
    await db.collection('templates').createIndex({ createdBy: 1 });
    await db.collection('templates').createIndex({ isPublic: 1 });
    
    // Analyses collection
    await db.collection('analyses').createIndex({ survey: 1 }, { unique: true });
    
    // Record migration
    await db.collection('migrations').insertOne({
      ...migrationInfo,
      appliedAt: new Date()
    });
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error(`Migration error: ${error.message}`);
    return false;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Revert migration
const down = async () => {
  try {
    // Connect to database
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/customer-survey');
    console.log(`Migration rollback connected to MongoDB: ${conn.connection.host}`);
    
    const db = mongoose.connection.db;
    
    // Drop collections (in reverse order of dependencies)
    console.log('Dropping collections...');
    await db.collection('analyses').drop().catch(() => console.log('Collection analyses does not exist'));
    await db.collection('responses').drop().catch(() => console.log('Collection responses does not exist'));
    await db.collection('templates').drop().catch(() => console.log('Collection templates does not exist'));
    await db.collection('surveys').drop().catch(() => console.log('Collection surveys does not exist'));
    await db.collection('users').drop().catch(() => console.log('Collection users does not exist'));
    
    // Remove migration record
    await db.collection('migrations').deleteOne({ version: migrationInfo.version });
    
    console.log('Migration rollback completed successfully');
    return true;
  } catch (error) {
    console.error(`Migration rollback error: ${error.message}`);
    return false;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';
  
  if (command === 'up') {
    up().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else if (command === 'down') {
    down().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    console.error('Invalid command. Use "up" or "down"');
    process.exit(1);
  }
}

module.exports = { up, down, migrationInfo }; 