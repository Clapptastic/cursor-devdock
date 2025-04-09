/**
 * Supabase connection test script
 * Tests connectivity to Supabase and verifies table access
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const colors = require('colors/safe');
const ora = require('ora');

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// Bail if required configuration is missing
if (!supabaseUrl || !supabaseKey) {
  console.error(colors.red('❌ Missing Supabase credentials. Please check your .env file.'));
  process.exit(1);
}

// Test tables to check access to
const TABLES_TO_CHECK = [
  'health_check',
  'users',
  'templates',
  'surveys',
  'responses',
  'analyses',
  'notifications'
];

// Initialize spinner for better UX
const spinner = ora('Initializing Supabase client');

async function testSupabaseConnection() {
  try {
    spinner.start();
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    spinner.succeed('Supabase client initialized');
    
    // Test basic connection by getting server timestamp
    spinner.text = 'Testing connection';
    spinner.start();
    const { data: serverTimeData, error: serverTimeError } = await supabase
      .rpc('get_server_timestamp');
    
    if (serverTimeError) {
      spinner.fail('Failed to fetch server timestamp');
      throw serverTimeError;
    }
    
    spinner.succeed(`Connected to Supabase: Server time is ${serverTimeData}`);
    
    // Check table access
    console.log(colors.cyan('\nChecking table access:'));
    const tableResults = [];
    
    for (const table of TABLES_TO_CHECK) {
      spinner.text = `Checking access to ${table} table`;
      spinner.start();
      
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1);
        
        if (error) {
          spinner.fail(`❌ ${table}: ${error.message}`);
          tableResults.push({ table, success: false, error: error.message });
        } else {
          spinner.succeed(`✅ ${table}: ${count || 0} records`);
          tableResults.push({ table, success: true, count: count || 0 });
        }
      } catch (error) {
        spinner.fail(`❌ ${table}: ${error.message}`);
        tableResults.push({ table, success: false, error: error.message });
      }
    }
    
    // Summary
    console.log(colors.cyan('\nConnection test summary:'));
    const successCount = tableResults.filter(r => r.success).length;
    
    if (successCount === TABLES_TO_CHECK.length) {
      console.log(colors.green(`✅ All ${successCount} tables are accessible`));
    } else {
      console.log(colors.yellow(`⚠️ ${successCount}/${TABLES_TO_CHECK.length} tables are accessible`));
      
      // List inaccessible tables
      const inaccessible = tableResults.filter(r => !r.success);
      console.log(colors.red('\nInaccessible tables:'));
      inaccessible.forEach(result => {
        console.log(colors.red(`- ${result.table}: ${result.error}`));
      });
      
      console.log(colors.yellow('\nPossible solutions:'));
      console.log(colors.yellow('1. Check if tables exist in the database'));
      console.log(colors.yellow('2. Verify you have proper permissions'));
      console.log(colors.yellow('3. Run the migration script: npm run db:migrate'));
    }
    
    // Check RLS policies if we have access to the information_schema
    try {
      spinner.text = 'Checking RLS policies';
      spinner.start();
      
      const { data: rlsData, error: rlsError } = await supabase.rpc('get_rls_policies');
      
      if (rlsError) {
        spinner.fail('Could not check RLS policies');
      } else {
        spinner.succeed(`Found ${rlsData.length} RLS policies`);
        console.log(colors.cyan('\nRLS Policy Summary:'));
        
        // Group policies by table
        const policyByTable = {};
        rlsData.forEach(policy => {
          if (!policyByTable[policy.table]) policyByTable[policy.table] = [];
          policyByTable[policy.table].push(policy);
        });
        
        // Print policy summary
        Object.entries(policyByTable).forEach(([table, policies]) => {
          console.log(colors.cyan(`\n${table} (${policies.length} policies):`));
          policies.forEach(policy => {
            console.log(`- ${policy.name} (${policy.operation})`);
          });
        });
      }
    } catch (error) {
      spinner.fail('Failed to check RLS policies');
    }
    
  } catch (error) {
    spinner.fail(`Connection failed: ${error.message}`);
    console.error(colors.red(`\nError details: ${JSON.stringify(error, null, 2)}`));
    process.exit(1);
  }
}

// Add RLS policy check function
async function setupRLSCheck() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.rpc('exec', {
      query: `
        CREATE OR REPLACE FUNCTION get_rls_policies()
        RETURNS TABLE (
          table_name text,
          name text,
          operation text,
          definition text
        ) AS $$
        BEGIN
          RETURN QUERY SELECT 
            tablename::text as table_name,
            policyname::text as name,
            cmd::text as operation,
            qual::text as definition
          FROM pg_policies
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        END;
        $$ LANGUAGE plpgsql;
      `
    }).catch(() => {
      // Function might already exist or we don't have permissions
      // We'll handle errors in the main function
    });
  } catch (error) {
    // Silently fail - we'll handle this in the main function
  }
}

// Run the test
setupRLSCheck()
  .then(() => testSupabaseConnection())
  .catch(error => {
    console.error(colors.red(`Unexpected error: ${error.message}`));
    process.exit(1);
  }); 