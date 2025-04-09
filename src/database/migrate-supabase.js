/**
 * Supabase SQL migration runner
 * Runs SQL migrations directly on the Supabase database
 * 
 * This script is useful for deploying schema changes to a hosted Supabase instance
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'run';
const specificFile = args[1];

// Supported commands
const COMMANDS = ['run', 'list', 'create'];

if (!COMMANDS.includes(command)) {
  console.error(`Invalid command: ${command}`);
  console.error(`Supported commands: ${COMMANDS.join(', ')}`);
  process.exit(1);
}

// Initialize Supabase client
function initSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Get all SQL migration files in the migrations directory
function getSqlMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations', 'sql');
  
  try {
    if (!fs.existsSync(migrationsDir)) {
      console.log(`Creating migrations directory: ${migrationsDir}`);
      fs.mkdirSync(migrationsDir, { recursive: true });
      return [];
    }
    
    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.startsWith('.'))
      .sort();
  } catch (error) {
    console.error('Error listing migration files:', error);
    return [];
  }
}

// Create a new SQL migration file
async function createMigration(name) {
  if (!name) {
    console.error('Please provide a migration name');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
  const migrationsDir = path.join(__dirname, 'migrations', 'sql');
  
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  const filePath = path.join(migrationsDir, filename);
  
  const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Run migration
BEGIN;

-- Add your SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS new_table (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Record migration
INSERT INTO migrations (name, applied_at)
VALUES ('${filename}', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Rollback migration
-- BEGIN;
-- 
-- -- Add your rollback SQL here
-- -- Example:
-- -- DROP TABLE IF EXISTS new_table;
-- 
-- -- Remove migration record
-- DELETE FROM migrations WHERE name = '${filename}';
-- 
-- COMMIT;
`;
  
  fs.writeFileSync(filePath, template);
  console.log(`Migration file created: ${filePath}`);
}

// List all SQL migration files
function listMigrations() {
  const files = getSqlMigrationFiles();
  
  if (files.length === 0) {
    console.log('No SQL migrations found');
    return;
  }
  
  console.log(`Found ${files.length} SQL migration files:`);
  files.forEach(file => console.log(`- ${file}`));
}

// Run SQL migration files
async function runMigrations(specificFile = null) {
  const supabase = initSupabaseClient();
  const files = getSqlMigrationFiles();
  
  if (files.length === 0) {
    console.log('No SQL migrations found');
    return;
  }
  
  // Create migrations table if it doesn't exist
  try {
    console.log('Ensuring migrations table exists...');
    
    const { error } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS migrations (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error creating migrations table:', error.message);
    
    // Try creating the exec function if it doesn't exist
    try {
      await supabase.sql(`
        CREATE OR REPLACE FUNCTION exec(query text) 
        RETURNS void LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE query;
        END;
        $$;
      `);
      
      // Try again
      const { error } = await supabase.rpc('exec', {
        query: `
          CREATE TABLE IF NOT EXISTS migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `
      });
      
      if (error) throw error;
    } catch (retryError) {
      console.error('Error setting up migrations:', retryError.message);
      process.exit(1);
    }
  }
  
  // Get already applied migrations
  const { data: appliedMigrations, error: fetchError } = await supabase
    .from('migrations')
    .select('name');
  
  if (fetchError) {
    console.error('Error fetching applied migrations:', fetchError.message);
    process.exit(1);
  }
  
  const appliedMigrationNames = appliedMigrations?.map(m => m.name) || [];
  
  // Filter migrations to run
  const migrationsToRun = specificFile
    ? files.filter(file => file === specificFile || file.startsWith(specificFile))
    : files.filter(file => !appliedMigrationNames.includes(file));
  
  if (migrationsToRun.length === 0) {
    console.log('No new migrations to run');
    return;
  }
  
  console.log(`Running ${migrationsToRun.length} migration(s)...`);
  
  for (const file of migrationsToRun) {
    const filePath = path.join(__dirname, 'migrations', 'sql', file);
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running migration: ${file}`);
      
      const { error } = await supabase.rpc('exec', { query: sql });
      
      if (error) {
        console.error(`Error running migration ${file}:`, error.message);
        process.exit(1);
      }
      
      console.log(`Successfully applied migration: ${file}`);
    } catch (error) {
      console.error(`Error processing migration ${file}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully');
}

// Main function
async function main() {
  try {
    switch (command) {
      case 'list':
        listMigrations();
        break;
      case 'create':
        await createMigration(specificFile);
        break;
      case 'run':
        await runMigrations(specificFile);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 