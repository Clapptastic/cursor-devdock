/**
 * Tests for health check endpoints
 */
const request = require('supertest');
const app = require('../src/server');
const { getDB, checkHealth } = require('../src/config/database');

// Mock the database module
jest.mock('../src/config/database', () => ({
  getDB: jest.fn(),
  closeDB: jest.fn(),
  checkHealth: jest.fn(),
  getServerTimestamp: jest.fn()
}));

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /health', () => {
    it('should return 200 status when database is healthy', async () => {
      // Mock checkHealth to return true
      checkHealth.mockResolvedValue(true);
      
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('database.connected', true);
      expect(res.body).toHaveProperty('database.status', 'ok');
    });
    
    it('should return 503 status when database is not healthy', async () => {
      // Mock checkHealth to return false
      checkHealth.mockResolvedValue(false);
      
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(503);
      expect(res.body).toHaveProperty('status', 'degraded');
      expect(res.body).toHaveProperty('database.connected', false);
      expect(res.body).toHaveProperty('database.status', 'error');
    });
  });
  
  describe('GET /health/ready', () => {
    it('should always return 200 status', async () => {
      const res = await request(app).get('/health/ready');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ready');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
}); 