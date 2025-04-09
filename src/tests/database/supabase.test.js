const { createClient } = require('@supabase/supabase-js');
const { getSupabase, getTablesStats } = require('../../database/supabase');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('Supabase Client Tests', () => {
  let originalEnv;
  let mockSupabaseClient;

  beforeAll(() => {
    // Save original env
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock environment
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_KEY = 'test-key';
    
    // Set up mock client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      rpc: jest.fn(),
      auth: {
        getSession: jest.fn()
      }
    };
    
    createClient.mockReturnValue(mockSupabaseClient);
  });

  describe('getSupabase', () => {
    it('should create and return a Supabase client with correct params', () => {
      const client = getSupabase();
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        'test-key'
      );
      expect(client).toBe(mockSupabaseClient);
    });

    it('should throw an error if environment variables are missing', () => {
      // Remove environment variables
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_KEY;
      
      expect(() => getSupabase()).toThrow('Supabase configuration missing');
    });

    it('should reuse the existing client on subsequent calls', () => {
      // First call should create a new client
      const client1 = getSupabase();
      expect(createClient).toHaveBeenCalledTimes(1);
      
      // Second call should reuse the client
      const client2 = getSupabase();
      expect(createClient).toHaveBeenCalledTimes(1);
      
      expect(client1).toBe(client2);
    });
  });

  describe('getTablesStats', () => {
    it('should return stats for all tables', async () => {
      // Mock successful response for each table
      const mockResponse = { 
        data: 10, 
        error: null 
      };
      
      // Set up the mock to return the expected response
      mockSupabaseClient.from.mockImplementation(() => mockSupabaseClient);
      mockSupabaseClient.select.mockImplementation(() => mockSupabaseClient);
      mockSupabaseClient.count.mockImplementation(() => Promise.resolve(mockResponse));
      
      const stats = await getTablesStats();
      
      // Check that from() was called for each table
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('templates');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('surveys');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('responses');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('analyses');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications');
      
      // Check that count() was called for each table
      expect(mockSupabaseClient.count).toHaveBeenCalledTimes(6);
      
      // Check that the result has the expected structure with counts
      expect(stats).toEqual({
        users: 10,
        templates: 10,
        surveys: 10,
        responses: 10,
        analyses: 10,
        notifications: 10
      });
    });

    it('should handle errors and set count to -1', async () => {
      // Mock successful responses for some tables and errors for others
      mockSupabaseClient.from.mockImplementation((tableName) => {
        if (tableName === 'users' || tableName === 'templates') {
          return {
            select: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue({ data: 10, error: null })
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
          };
        }
      });
      
      const stats = await getTablesStats();
      
      // Check that the result has the expected structure
      expect(stats).toEqual({
        users: 10,
        templates: 10,
        surveys: -1,
        responses: -1,
        analyses: -1,
        notifications: -1
      });
    });
    
    it('should handle unexpected exceptions', async () => {
      // Mock a complete failure
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const stats = await getTablesStats();
      
      // All values should be -1
      expect(stats).toEqual({
        users: -1,
        templates: -1,
        surveys: -1,
        responses: -1,
        analyses: -1,
        notifications: -1
      });
    });
  });
}); 