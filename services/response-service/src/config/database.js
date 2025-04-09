/**
 * Database Configuration
 * Sets up the Supabase connection
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Create a mock client in development mode if Supabase credentials are missing
if (!supabaseUrl || !supabaseKey) {
  logger.warn('Supabase configuration is missing. Using mock client in development mode.', {
    service: 'response-service'
  });
}

// Initialize Supabase client with real or mock credentials
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : {
      from: () => ({
        select: () => ({
          limit: () => ({
            data: [{ id: 'mock-id', created_at: new Date().toISOString(), survey_id: 'mock-survey-id' }],
            error: null
          })
        }),
        insert: () => ({ data: { id: 'mock-id' }, error: null }),
        update: () => ({ data: { id: 'mock-id' }, error: null }),
        delete: () => ({ data: { id: 'mock-id' }, error: null })
      })
    };

// Test connection
const testConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Using mock Supabase client for development');
      return true;
    }
    
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      throw new Error(`Supabase connection test failed: ${error.message}`);
    }
    
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.warn(`Could not connect to Supabase: ${error.message}. Using mock client in development.`);
    return process.env.NODE_ENV === 'development'; // Continue in dev mode, fail in production
  }
};

module.exports = {
  supabase,
  testConnection
}; 