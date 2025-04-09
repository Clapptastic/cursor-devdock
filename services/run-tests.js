/**
 * Run Unit Tests Script
 * 
 * This script runs only the unit tests for each microservice in isolation.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define the services to test
const services = [
  'survey-service',
  'response-service',
  'api-gateway',
  'ai-service'
];

// Track test results
const results = {
  passed: [],
  failed: []
};

console.log('Starting unit tests for all services...\n');

// Run tests for each service
services.forEach(service => {
  const servicePath = path.join(__dirname, service);
  
  // Check if service directory exists
  if (!fs.existsSync(servicePath)) {
    console.log(`❌ Service directory not found: ${service}`);
    results.failed.push(service);
    return;
  }
  
  const testPath = path.join(servicePath, 'tests', 'unit');
  
  // Check if unit tests directory exists
  if (!fs.existsSync(testPath)) {
    console.log(`❌ No unit tests found for service: ${service}`);
    results.failed.push(service);
    return;
  }
  
  try {
    console.log(`Running tests for ${service}...`);
    
    // Run Jest with specific unit test path and testPathIgnorePatterns to exclude integration tests
    const command = `cd ${service} && npx jest "tests/unit/.*\\.test\\.js$" --testPathIgnorePatterns="tests/integration" --env=node`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Tests for ${service} completed successfully\n`);
    results.passed.push(service);
  } catch (error) {
    console.log(`❌ Tests for ${service} failed\n`);
    results.failed.push(service);
  }
});

// Display summary
console.log('\n===== TEST SUMMARY =====');
console.log(`Passed: ${results.passed.length} services`);
if (results.passed.length > 0) {
  console.log(' - ' + results.passed.join('\n - '));
}

console.log(`Failed: ${results.failed.length} services`);
if (results.failed.length > 0) {
  console.log(' - ' + results.failed.join('\n - '));
  process.exit(1);
}

console.log('\nAll unit tests passed successfully!'); 