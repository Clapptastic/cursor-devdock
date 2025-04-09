// Mock environment variables
process.env.API_BASE_URL = 'http://localhost:3000';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add global test timeout
jest.setTimeout(10000); 