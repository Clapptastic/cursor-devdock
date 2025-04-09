/**
 * Database index management script
 * Utility to list, create, and drop indexes in MongoDB
 */
const mongoose = require('mongoose');
const connectDB = require('../backend/config/database');

// Import models
const User = require('../backend/models/User');
const Survey = require('../backend/models/Survey');
const Response = require('../backend/models/Response');
const Template = require('../backend/models/Template');
const Analysis = require('../backend/models/Analysis');

/**
 * List all indexes for each collection
 */
const listIndexes = async () => {
  try {
    console.log('Listing indexes for all collections...\n');
    
    // Get database connection
    await connectDB();
    
    // Models to check
    const models = {
      User,
      Survey,
      Response,
      Template,
      Analysis
    };
    
    // List indexes for each model
    for (const [modelName, model] of Object.entries(models)) {
      console.log(`\n--- ${modelName} Indexes ---`);
      
      const indexes = await model.collection.getIndexes();
      
      if (Object.keys(indexes).length === 0) {
        console.log('No indexes found');
        continue;
      }
      
      // Display each index
      for (const [indexName, indexInfo] of Object.entries(indexes)) {
        console.log(`\nIndex: ${indexName}`);
        console.log('Keys:', JSON.stringify(indexInfo.key, null, 2));
        console.log('Options:', JSON.stringify({
          unique: indexInfo.unique || false,
          sparse: indexInfo.sparse || false,
          background: indexInfo.background || false,
          expireAfterSeconds: indexInfo.expireAfterSeconds
        }, null, 2));
      }
    }
    
    console.log('\nIndex listing complete.');
  } catch (error) {
    console.error('Error listing indexes:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

/**
 * Create missing indexes defined in models
 */
const createIndexes = async () => {
  try {
    console.log('Creating indexes from model definitions...\n');
    
    // Get database connection
    await connectDB();
    
    // Models to create indexes for
    const models = {
      User,
      Survey,
      Response,
      Template,
      Analysis
    };
    
    // Create indexes for each model
    for (const [modelName, model] of Object.entries(models)) {
      console.log(`\nCreating indexes for ${modelName}...`);
      
      // Use built-in function to ensure all indexes are created
      await model.ensureIndexes();
      
      console.log(`Indexes for ${modelName} created.`);
    }
    
    console.log('\nIndex creation complete.');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

/**
 * Drop all indexes for a specific collection or all collections
 * @param {string} collectionName - Optional collection name to target
 */
const dropIndexes = async (collectionName = null) => {
  try {
    console.log(`Dropping indexes${collectionName ? ` for ${collectionName}` : ' for all collections'}...\n`);
    
    // Get database connection
    await connectDB();
    
    // Models to drop indexes for
    const models = {
      User,
      Survey,
      Response,
      Template,
      Analysis
    };
    
    // If collection name is provided, only drop indexes for that collection
    if (collectionName) {
      if (!models[collectionName]) {
        console.error(`Collection ${collectionName} not found`);
        return;
      }
      
      console.log(`Dropping indexes for ${collectionName}...`);
      await models[collectionName].collection.dropIndexes();
      console.log(`Indexes for ${collectionName} dropped.`);
    } else {
      // Drop indexes for all collections
      for (const [modelName, model] of Object.entries(models)) {
        console.log(`Dropping indexes for ${modelName}...`);
        await model.collection.dropIndexes();
        console.log(`Indexes for ${modelName} dropped.`);
      }
    }
    
    console.log('\nIndex drop complete.');
  } catch (error) {
    console.error('Error dropping indexes:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

/**
 * Main function that interprets command-line arguments and executes the appropriate action
 */
const main = async () => {
  // Get command-line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  const collectionName = args[1];
  
  switch (command) {
    case 'list':
      await listIndexes();
      break;
    case 'create':
      await createIndexes();
      break;
    case 'drop':
      await dropIndexes(collectionName);
      break;
    default:
      console.log(`
Usage:
  node manageIndexes.js list                  - List all indexes
  node manageIndexes.js create                - Create all indexes defined in models
  node manageIndexes.js drop [collectionName] - Drop indexes for a specific collection or all collections
      `);
      break;
  }
};

// Run main function if script is run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  listIndexes,
  createIndexes,
  dropIndexes
}; 