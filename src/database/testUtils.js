/**
 * Database testing utilities
 * Provides functions for database testing
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Global MongoMemoryServer instance
 */
let mongoServer;

/**
 * Connect to in-memory MongoDB database for testing
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  await mongoose.connect(uri, mongooseOpts);
  return mongoose.connection;
};

/**
 * Disconnect from in-memory MongoDB database
 * @returns {Promise<void>}
 */
const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections in the database
 * @returns {Promise<void>}
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Generate sample user data for testing
 * @param {Object} overrides - Fields to override the defaults
 * @returns {Object} Sample user data
 */
const sampleUserData = (overrides = {}) => {
  return {
    name: 'Test User',
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'password123',
    company: 'Test Company',
    role: 'user',
    ...overrides
  };
};

/**
 * Generate sample survey data for testing
 * @param {Object} overrides - Fields to override the defaults
 * @returns {Object} Sample survey data
 */
const sampleSurveyData = (overrides = {}) => {
  return {
    title: 'Test Survey',
    description: 'A test survey for unit testing',
    questions: [
      {
        text: 'What is your favorite color?',
        type: 'text',
        required: true
      },
      {
        text: 'Rate our service',
        type: 'rating',
        required: true,
        options: ['1', '2', '3', '4', '5']
      }
    ],
    createdBy: new mongoose.Types.ObjectId().toString(),
    status: 'draft',
    ...overrides
  };
};

/**
 * Generate sample template data for testing
 * @param {Object} overrides - Fields to override the defaults
 * @returns {Object} Sample template data
 */
const sampleTemplateData = (overrides = {}) => {
  return {
    name: 'Test Template',
    description: 'A test template for unit testing',
    category: 'General',
    questions: [
      {
        text: 'What is your favorite color?',
        type: 'text',
        required: true
      },
      {
        text: 'Rate our service',
        type: 'rating',
        required: true,
        options: ['1', '2', '3', '4', '5']
      }
    ],
    tags: ['test', 'sample'],
    createdBy: new mongoose.Types.ObjectId().toString(),
    isPublic: true,
    ...overrides
  };
};

/**
 * Generate sample response data for testing
 * @param {Object} overrides - Fields to override the defaults
 * @returns {Object} Sample response data
 */
const sampleResponseData = (overrides = {}) => {
  return {
    survey: new mongoose.Types.ObjectId().toString(),
    respondent: new mongoose.Types.ObjectId().toString(),
    answers: [
      {
        questionId: new mongoose.Types.ObjectId().toString(),
        questionText: 'What is your favorite color?',
        questionType: 'text',
        value: 'Blue'
      },
      {
        questionId: new mongoose.Types.ObjectId().toString(),
        questionText: 'Rate our service',
        questionType: 'rating',
        value: 4
      }
    ],
    completed: true,
    ...overrides
  };
};

/**
 * Generate sample analysis data for testing
 * @param {Object} overrides - Fields to override the defaults
 * @returns {Object} Sample analysis data
 */
const sampleAnalysisData = (overrides = {}) => {
  return {
    survey: new mongoose.Types.ObjectId().toString(),
    summary: 'This is a test analysis summary',
    insights: [
      {
        question: 'What is your favorite color?',
        analysisText: 'Most respondents preferred blue and green colors',
        sentiment: 'positive',
        keywords: ['blue', 'green', 'color'],
        score: 8
      }
    ],
    ...overrides
  };
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  sampleUserData,
  sampleSurveyData,
  sampleTemplateData,
  sampleResponseData,
  sampleAnalysisData
}; 