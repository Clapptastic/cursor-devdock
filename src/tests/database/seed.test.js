const { seed } = require('../../database/seed');
const bcrypt = require('bcryptjs');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn()
  }))
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}));

describe('Database Seed Tests', () => {
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
    
    // Mock successful responses
    mockSupabase.from().insert().execute.mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] });
    mockSupabase.from().upsert().execute.mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] });
    mockSupabase.from().delete().execute.mockResolvedValue({ error: null, data: null });
  });

  afterEach(() => {
    // Restore console functions
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('seed function', () => {
    it('should seed all tables in the correct order', async () => {
      await seed();
      
      // Verify password hashing was called
      expect(bcrypt.hash).toHaveBeenCalled();
      
      // Check that the logs have the right messages
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting database seeding...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding users...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding templates...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding surveys...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding responses...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding notifications...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database seeding completed successfully.');
      
      // Check that insert was called for each table
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.from).toHaveBeenCalledWith('templates');
      expect(mockSupabase.from).toHaveBeenCalledWith('surveys');
      expect(mockSupabase.from).toHaveBeenCalledWith('responses');
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      
      // Check that insert and execute were called
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockSupabase.execute).toHaveBeenCalled();
    });

    it('should handle user insertion error', async () => {
      // Set up error for users table
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'users') {
          return {
            insert: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ error: { message: 'Database error' }, data: null })
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] })
        };
      });
      
      await expect(seed()).rejects.toThrow('Database error');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding users:', expect.any(Object));
    });

    it('should handle template insertion error', async () => {
      // Set up error for templates table
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'templates') {
          return {
            insert: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ error: { message: 'Database error' }, data: null })
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] })
        };
      });
      
      await expect(seed()).rejects.toThrow('Database error');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding templates:', expect.any(Object));
    });

    it('should handle survey insertion error', async () => {
      // Set up error for surveys table
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'surveys') {
          return {
            insert: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ error: { message: 'Database error' }, data: null })
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] })
        };
      });
      
      await expect(seed()).rejects.toThrow('Database error');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding surveys:', expect.any(Object));
    });

    it('should handle response insertion error', async () => {
      // Set up error for responses table
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'responses') {
          return {
            insert: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ error: { message: 'Database error' }, data: null })
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] })
        };
      });
      
      await expect(seed()).rejects.toThrow('Database error');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding responses:', expect.any(Object));
    });

    it('should handle notification insertion error', async () => {
      // Set up error for notifications table
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'notifications') {
          return {
            insert: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ error: { message: 'Database error' }, data: null })
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'mocked-uuid' }] })
        };
      });
      
      await expect(seed()).rejects.toThrow('Database error');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding notifications:', expect.any(Object));
    });
  });
}); 