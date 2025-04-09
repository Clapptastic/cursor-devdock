const mongoose = require('mongoose');
const connectDB = require('../backend/config/database');

// Models
const User = require('../backend/models/User');
const Survey = require('../backend/models/Survey');
const Response = require('../backend/models/Response');
const Template = require('../backend/models/Template');
const Analysis = require('../backend/models/Analysis');

/**
 * Initialize database connection and create indexes
 */
const initDatabase = async () => {
  try {
    // Connect to MongoDB
    const conn = await connectDB();
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    
    // Create text indexes to support search operations
    console.log('Creating database indexes...');
    
    // Survey index - for searching surveys
    await Survey.collection.createIndex(
      { title: 'text', description: 'text', businessContext: 'text', targetAudience: 'text' },
      { name: 'survey_text_index' }
    );
    
    // User email index - for quick email lookup
    await User.collection.createIndex(
      { email: 1 },
      { unique: true, name: 'user_email_index' }
    );
    
    // Response survey index - for finding responses to a particular survey
    await Response.collection.createIndex(
      { survey: 1 },
      { name: 'response_survey_index' }
    );
    
    console.log('Database initialization complete');
    return { success: true };
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// If this file is run directly, execute the initialization
if (require.main === module) {
  (async () => {
    const result = await initDatabase();
    if (result.success) {
      console.log('Database initialization successful');
    } else {
      console.error('Database initialization failed:', result.error);
    }
    mongoose.connection.close();
  })();
}

module.exports = initDatabase; 