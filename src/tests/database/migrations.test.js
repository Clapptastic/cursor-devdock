const { up, down } = require('../../database/migrations/20240607_init_schema');

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    sql: jest.fn()
  }))
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('-- SQL functions placeholder')
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path/to/file.sql')
}));

describe('Database Migration Tests', () => {
  let mockSupabase;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processEnvBackup;

  beforeAll(() => {
    // Backup the process.env object
    processEnvBackup = { ...process.env };
    
    // Set mock environment variables
    process.env.SUPABASE_URL = 'https://mock-project.supabase.co';
    process.env.SUPABASE_KEY = 'mock-api-key';
  });

  afterAll(() => {
    // Restore the process.env object
    process.env = processEnvBackup;
  });

  beforeEach(() => {
    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Supabase mock
    mockSupabase = require('@supabase/supabase-js').createClient();
    
    // Mock the rpc function for successful calls
    mockSupabase.rpc.mockImplementation((functionName, params) => {
      if (functionName === 'create_table_if_not_exists' && params.table_name === 'analyses') {
        return Promise.resolve({ error: null, data: null });
      }
      return Promise.resolve({ error: null, data: 'Success' });
    });
  });

  afterEach(() => {
    // Restore console functions
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('up migration', () => {
    it('should create all tables in the correct order', async () => {
      await up();
      
      // Check that the logs have the right messages
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting schema migration...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating health_check table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating users table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating templates table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating surveys table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating responses table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating analyses table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating notifications table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Schema migration completed successfully.');
      
      // Check that rpc was called to create analyses table
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_table_if_not_exists', {
        table_name: 'analyses',
        definition: expect.stringContaining('id UUID PRIMARY KEY')
      });
    });

    it('should handle analyses table creation error', async () => {
      // Setup mock for error response
      mockSupabase.rpc.mockImplementation((functionName, params) => {
        if (functionName === 'create_table_if_not_exists' && params.table_name === 'analyses') {
          return Promise.resolve({ error: { message: 'Database error' }, data: null });
        }
        return Promise.resolve({ error: null, data: 'Success' });
      });
      
      // Test that error is handled
      await expect(up()).rejects.toThrow('Database error');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating analyses table:', expect.any(Object));
    });
  });

  describe('down migration', () => {
    it('should drop all tables in the reverse order', async () => {
      // Mock successful delete operations
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'analyses') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
          };
        }
        return mockSupabase;
      });
      
      await down();
      
      // Check that the logs have the right messages in reverse order
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting schema rollback...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping notifications table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping analyses table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping responses table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping surveys table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping templates table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping users table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Dropping health_check table...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Schema rollback completed successfully.');
      
      // Check that the analyses table was dropped
      expect(mockSupabase.from).toHaveBeenCalledWith('analyses');
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should continue if analyses table does not exist', async () => {
      // Mock the error response for non-existent table
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'analyses') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue(Promise.resolve({
              error: { code: '42P01' }, // PostgreSQL code for table does not exist
              data: null
            }))
          };
        }
        return mockSupabase;
      });
      
      await down();
      
      // Should still complete successfully
      expect(consoleLogSpy).toHaveBeenCalledWith('Schema rollback completed successfully.');
    });

    it('should throw error for other analyses table errors', async () => {
      // Mock the error response for other errors
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'analyses') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue(Promise.resolve({
              error: { code: 'OTHER_ERROR', message: 'Permission denied' },
              data: null
            }))
          };
        }
        return mockSupabase;
      });
      
      await expect(down()).rejects.toThrow('Permission denied');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error dropping analyses table:', expect.any(Object));
    });
  });
}); 