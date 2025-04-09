/**
 * Tests for data processing endpoints
 */
const request = require('supertest');
const app = require('../src/server');
const { getDB } = require('../src/config/database');

// Mock the database module
jest.mock('../src/config/database', () => {
  const mockSupabaseResponse = (data = [], error = null) => ({
    data,
    error,
    count: data.length
  });
  
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  };
  
  return {
    getDB: jest.fn().mockReturnValue(mockSupabase),
    closeDB: jest.fn(),
    checkHealth: jest.fn().mockResolvedValue(true),
    getServerTimestamp: jest.fn(),
    mockSupabaseResponse,
    mockSupabase
  };
});

// Mock environment variables
process.env.API_KEY = 'test-api-key';

describe('Process API Endpoints', () => {
  let mockSupabase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = getDB();
  });
  
  describe('POST /api/process', () => {
    it('should return 401 when API key is missing', async () => {
      const res = await request(app)
        .post('/api/process')
        .send({ data: [{ id: 1, value: 'test' }] });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'API key missing');
    });
    
    it('should return 403 when API key is invalid', async () => {
      const res = await request(app)
        .post('/api/process')
        .set('x-api-key', 'invalid-key')
        .send({ data: [{ id: 1, value: 'test' }] });
      
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Invalid API key');
    });
    
    it('should process data and return 201 with valid API key', async () => {
      // Mock the Supabase response
      const mockProcessedData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        original: [{ id: 1, value: 'test' }],
        processed: [{ id: 1, value: 'test', processed: true }],
        created_at: new Date().toISOString()
      };
      
      mockSupabase.insert.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [mockProcessedData],
        error: null
      });
      
      const res = await request(app)
        .post('/api/process')
        .set('x-api-key', 'test-api-key')
        .send({ data: [{ id: 1, value: 'test' }] });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.id');
      expect(res.body.data).toHaveProperty('original');
      expect(res.body.data).toHaveProperty('processed');
    });
    
    it('should return 400 when data is missing', async () => {
      const res = await request(app)
        .post('/api/process')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Data is required');
    });
  });
  
  describe('GET /api/process/:id', () => {
    it('should return processed data with valid ID', async () => {
      const mockProcessedData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        original: [{ id: 1, value: 'test' }],
        processed: [{ id: 1, value: 'test', processed: true }],
        created_at: new Date().toISOString()
      };
      
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: mockProcessedData,
        error: null
      });
      
      const res = await request(app)
        .get('/api/process/123e4567-e89b-12d3-a456-426614174000')
        .set('x-api-key', 'test-api-key');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.id', mockProcessedData.id);
    });
    
    it('should return 404 when ID is not found', async () => {
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Record not found' }
      });
      
      const res = await request(app)
        .get('/api/process/non-existent-id')
        .set('x-api-key', 'test-api-key');
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('GET /api/process', () => {
    it('should return paginated list of processed data', async () => {
      const mockProcessedData = [
        { id: '123', original: [], processed: [], created_at: new Date().toISOString() },
        { id: '456', original: [], processed: [], created_at: new Date().toISOString() }
      ];
      
      // Mock the count query
      mockSupabase.select.mockImplementationOnce(() => ({
        ...mockSupabase,
        count: 10,
        error: null
      }));
      
      // Mock the data query
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.range.mockImplementation(() => mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockProcessedData,
        error: null
      });
      
      const res = await request(app)
        .get('/api/process')
        .set('x-api-key', 'test-api-key');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
}); 