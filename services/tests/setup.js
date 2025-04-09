// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.JWT_SECRET = 'test-secret-key';

// Disable console output during tests
if (process.env.SILENT_TESTS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    // Keep error logs for debugging
    error: console.error,
  };
}

// Configure Jest timeout
jest.setTimeout(20000);

// Add global test helpers if needed
global.testUtils = {
  createMockRequest: (overrides = {}) => {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: { id: 'test-user-id', role: 'user' },
      ...overrides
    };
  },
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },
  createMockNext: () => jest.fn()
};

// Cleanup after all tests
afterAll(async () => {
  // Any global cleanup can go here
}); 