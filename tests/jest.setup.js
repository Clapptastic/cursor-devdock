// Increase timeout for all tests
jest.setTimeout(30000);

// Mock environment variables
process.env.MCP_KONNECT_URL = 'http://localhost:10000';
process.env.MCP_REST_API_URL = 'http://localhost:10001';
process.env.CLAUDE_TASK_MASTER_URL = 'http://localhost:10002';
process.env.SCRAPER_URL = 'http://localhost:10004';
process.env.BROWSER_TOOLS_URL = 'http://localhost:10005';
process.env.DEBUG_VISUALIZER_URL = 'http://localhost:10006';
process.env.KANEO_URL = 'http://localhost:10007';

// Global before/after hooks
beforeAll(() => {
  console.log('Starting test suite');
});

afterAll(() => {
  console.log('Test suite completed');
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 