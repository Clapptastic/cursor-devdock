/**
 * Database configuration and connection utility for Supabase
 * Manages connection to Supabase and provides database access functions
 */
const { createClient } = require('@supabase/supabase-js');

// Cached Supabase client instance
let supabaseClient = null;

/**
 * Initialize the Supabase client with the provided or environment credentials
 * @param {Object} options Optional connection parameters
 * @returns {Object} Supabase client instance
 */
const initSupabaseClient = (options = {}) => {
  // Get configuration from environment variables or options
  const supabaseUrl = options.url || process.env.SUPABASE_URL;
  const supabaseKey = options.key || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
  }
  
  // Create Supabase client with configuration
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    ...options
  });
};

/**
 * Get the Supabase client instance, creating a new one if it doesn't exist
 * @param {Object} options Optional connection parameters
 * @returns {Object} Supabase client instance
 */
const getDB = (options = {}) => {
  if (!supabaseClient) {
    supabaseClient = initSupabaseClient(options);
  }
  return supabaseClient;
};

/**
 * Close the Supabase connection and reset the client instance
 * Useful for testing environments where you need to reset the connection
 */
const closeDB = () => {
  supabaseClient = null;
};

/**
 * Run a health check on the database connection
 * @returns {Promise<boolean>} True if the connection is healthy
 */
const checkHealth = async () => {
  try {
    const supabase = getDB();
    const { data, error } = await supabase
      .from('health_check')
      .select('status')
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 && data[0].status === 'ok';
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Get the current timestamp from the database to ensure consistent timestamps
 * @returns {Promise<string>} Current database timestamp
 */
const getServerTimestamp = async () => {
  try {
    const supabase = getDB();
    const { data, error } = await supabase.rpc('get_server_timestamp');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get server timestamp:', error);
    return new Date().toISOString();
  }
};

module.exports = {
  getDB,
  closeDB,
  checkHealth,
  getServerTimestamp
}; 