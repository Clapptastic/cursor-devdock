/**
 * Migration script to initialize the Supabase schema for the Customer Survey application
 * Creates all necessary tables, indexes, and constraints for the application's data model
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load SQL functions
const sqlFunctionsPath = path.join(__dirname, 'sql', 'functions.sql');
const sqlFunctions = fs.readFileSync(sqlFunctionsPath, 'utf8');

/**
 * Initialize the Supabase client
 * @returns {Object} Supabase client instance
 */
function initSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Execute SQL query with error handling
 * @param {Object} supabase - Supabase client
 * @param {string} sql - SQL query to execute
 * @param {string} errorMessage - Custom error message
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(supabase, sql, errorMessage) {
  try {
    const { data, error } = await supabase.rpc('exec', { query: sql });
    
    if (error) {
      console.error(`${errorMessage}: ${error.message}`);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    throw err;
  }
}

/**
 * Creates the extension for UUID generation if it doesn't exist
 * @param {Object} supabase - Supabase client
 */
async function createExtensions(supabase) {
  try {
    console.log('Creating UUID extension...');
    await executeQuery(
      supabase,
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      'Failed to create UUID extension'
    );
    console.log('UUID extension created successfully.');
  } catch (error) {
    console.error('Error creating extensions:', error);
    throw error;
  }
}

/**
 * Creates the exec function for running SQL commands
 * @param {Object} supabase - Supabase client
 */
async function createExecFunction(supabase) {
  try {
    console.log('Creating exec function...');
    await supabase.rpc('exec', { 
      query: `
        CREATE OR REPLACE FUNCTION exec(query text) 
        RETURNS void LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE query;
        END;
        $$;
      `
    }).catch(e => {
      // If the function doesn't exist yet, create it directly
      if (e.message.includes('function exec(text) does not exist')) {
        return supabase.sql(`
          CREATE OR REPLACE FUNCTION exec(query text) 
          RETURNS void LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE query;
          END;
          $$;
        `);
      }
      throw e;
    });
    console.log('Exec function created successfully.');
  } catch (error) {
    console.error('Error creating exec function:', error);
    throw error;
  }
}

/**
 * Migrates the schema up by creating all tables and relationships
 */
async function up() {
  const supabase = initSupabaseClient();
  
  try {
    console.log('Starting schema migration...');
    
    // Create extensions and functions needed for migrations
    await createExtensions(supabase);
    await createExecFunction(supabase);
    
    // Create all SQL functions
    console.log('Creating SQL functions...');
    await executeQuery(
      supabase,
      sqlFunctions,
      'Failed to create SQL functions'
    );
    console.log('SQL functions created successfully.');
    
    // Create tables in order of their dependencies
    console.log('Creating health_check table...');
    await executeQuery(
      supabase,
      'SELECT create_health_check_table();',
      'Failed to create health_check table'
    );
    console.log('Health check table created successfully.');
    
    console.log('Creating users table...');
    await executeQuery(
      supabase,
      'SELECT create_users_table();',
      'Failed to create users table'
    );
    console.log('Users table created successfully.');
    
    console.log('Creating templates table...');
    await executeQuery(
      supabase,
      'SELECT create_templates_table();',
      'Failed to create templates table'
    );
    console.log('Templates table created successfully.');
    
    console.log('Creating surveys table...');
    await executeQuery(
      supabase,
      'SELECT create_surveys_table();',
      'Failed to create surveys table'
    );
    console.log('Surveys table created successfully.');
    
    console.log('Creating responses table...');
    await executeQuery(
      supabase,
      'SELECT create_responses_table();',
      'Failed to create responses table'
    );
    console.log('Responses table created successfully.');
    
    console.log('Creating analyses table...');
    const { error: analysesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'analyses',
      definition: `
        id UUID PRIMARY KEY,
        survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        analysis_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(survey_id, created_at)
      `
    });
    
    if (analysesError) {
      console.error('Error creating analyses table:', analysesError);
      throw analysesError;
    }
    console.log('Analyses table created successfully');
    
    console.log('Creating notifications table...');
    await executeQuery(
      supabase,
      'SELECT create_notifications_table();',
      'Failed to create notifications table'
    );
    console.log('Notifications table created successfully.');
    
    console.log('Schema migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Migrates the schema down by dropping all tables in reverse order
 */
async function down() {
  const supabase = initSupabaseClient();
  
  try {
    console.log('Starting schema rollback...');
    
    // Drop tables in reverse order of their dependencies
    console.log('Dropping notifications table...');
    await executeQuery(
      supabase,
      'DROP TABLE IF EXISTS notifications CASCADE;',
      'Failed to drop notifications table'
    );
    console.log('Notifications table dropped successfully.');
    
    console.log('Dropping analyses table...');
    const { error: analysesError } = await supabase.from('analyses').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    if (analysesError && analysesError.code !== '42P01') { // 42P01 is the Postgres error code for 'table does not exist'
      console.error('Error dropping analyses table:', analysesError);
      throw analysesError;
    }
    console.log('Analyses table dropped successfully.');
    
    console.log('Dropping responses table...');
    await executeQuery(
      supabase,
      'DROP TABLE IF EXISTS responses CASCADE;',
      'Failed to drop responses table'
    );
    console.log('Responses table dropped successfully.');
    
    console.log('Dropping surveys table...');
    await executeQuery(
      supabase,
      'DROP TABLE IF EXISTS surveys CASCADE;',
      'Failed to drop surveys table'
    );
    console.log('Surveys table dropped successfully.');
    
    console.log('Dropping templates table...');
    await executeQuery(
      supabase,
      'DROP TABLE IF EXISTS templates CASCADE;',
      'Failed to drop templates table'
    );
    console.log('Templates table dropped successfully.');
    
    console.log('Dropping users table...');
    await executeQuery(
      supabase,
      'DROP TABLE IF EXISTS users CASCADE;',
      'Failed to drop users table'
    );
    console.log('Users table dropped successfully.');
    
    console.log('Dropping health_check table...');
    await executeQuery(
      supabase,
      'DROP TABLE IF EXISTS health_check CASCADE;',
      'Failed to drop health_check table'
    );
    console.log('Health check table dropped successfully.');
    
    console.log('Schema rollback completed successfully.');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
}; 