/**
 * Jest setup for tests
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testjwtsecret';
process.env.PORT = '3001'; // Use a different port for testing

// Silence console logs during tests unless explicitly enabled
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Global test teardown
afterAll(() => {
  // Clean up any open connections or resources
  jest.clearAllMocks();
}); 