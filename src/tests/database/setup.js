/**
 * Database test setup
 * Setup file for database tests with Jest
 */
const mongoose = require('mongoose');

// Set mongoose options for tests
mongoose.set('strictQuery', true);

// Disable mongoose console logs during tests
mongoose.set('debug', false);

// Define Jest hooks for global setup and teardown
beforeAll(async () => {
  // Increase test timeout for database operations
  jest.setTimeout(15000);
  
  // Add global test functions if needed
});

// Handle unhandled promise rejections during tests
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection in tests:', err);
}); 