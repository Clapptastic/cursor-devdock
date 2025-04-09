#!/usr/bin/env node

/**
 * Demo script for the coverage badge feature
 * 
 * This script demonstrates how to:
 * 1. Run tests with coverage
 * 2. Update the coverage badge
 * 3. Verify the badge in the README
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set up colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Configuration
const README_PATH = path.join(__dirname, '..', 'README.md');

/**
 * Run a command and return output
 */
function runCommand(command, options = { silent: false }) {
  const { silent } = options;
  try {
    if (!silent) {
      console.log(`${colors.bright}${colors.cyan}$ ${command}${colors.reset}`);
    }
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    if (!silent) {
      console.error(`${colors.red}Error executing command:${colors.reset}`, error.message);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Check if the badge exists in README
 */
function verifyBadgeInReadme() {
  try {
    const readmeContent = fs.readFileSync(README_PATH, 'utf8');
    const badgeRegex = /\[!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-(\d+)%25-([a-z]+)\)\]/;
    const match = readmeContent.match(badgeRegex);
    
    if (match) {
      const percentage = parseInt(match[1], 10);
      const color = match[2];
      return { exists: true, percentage, color };
    }
    
    return { exists: false };
  } catch (error) {
    console.error(`${colors.red}Error reading README:${colors.reset}`, error.message);
    return { exists: false, error: error.message };
  }
}

/**
 * Main demo function
 */
async function runDemo() {
  console.log(`${colors.bright}${colors.white}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.white}║       Coverage Badge Demo Script         ║${colors.reset}`);
  console.log(`${colors.bright}${colors.white}╚══════════════════════════════════════════╝${colors.reset}`);
  
  // Step 1: Check if badge exists already
  console.log(`\n${colors.bright}${colors.white}Step 1: Checking current badge...${colors.reset}`);
  const initialBadge = verifyBadgeInReadme();
  
  if (initialBadge.exists) {
    console.log(`${colors.green}✓ Badge found in README${colors.reset}`);
    console.log(`  Current coverage: ${initialBadge.percentage}%, Color: ${initialBadge.color}`);
  } else {
    console.log(`${colors.yellow}⚠ Badge not found in README${colors.reset}`);
  }
  
  // Step 2: Run tests with coverage
  console.log(`\n${colors.bright}${colors.white}Step 2: Running tests with coverage...${colors.reset}`);
  console.log(`${colors.dim}(This may take a moment)${colors.reset}`);
  
  // Run tests with coverage (using a small subset for demo purposes)
  const testResult = runCommand('npm run test:backup:coverage');
  
  if (!testResult.success) {
    console.error(`${colors.red}✖ Failed to run tests${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Update coverage badge
  console.log(`\n${colors.bright}${colors.white}Step 3: Updating coverage badge...${colors.reset}`);
  
  const badgeResult = runCommand('npm run coverage:badge');
  
  if (!badgeResult.success) {
    console.error(`${colors.red}✖ Failed to update badge${colors.reset}`);
    process.exit(1);
  }
  
  // Step 4: Verify the badge was updated
  console.log(`\n${colors.bright}${colors.white}Step 4: Verifying badge update...${colors.reset}`);
  
  const updatedBadge = verifyBadgeInReadme();
  
  if (updatedBadge.exists) {
    console.log(`${colors.green}✓ Badge updated in README${colors.reset}`);
    console.log(`  Current coverage: ${updatedBadge.percentage}%, Color: ${updatedBadge.color}`);
    
    if (initialBadge.exists && initialBadge.percentage !== updatedBadge.percentage) {
      const diff = updatedBadge.percentage - initialBadge.percentage;
      const diffColor = diff >= 0 ? colors.green : colors.red;
      console.log(`  Coverage changed by ${diffColor}${diff >= 0 ? '+' : ''}${diff}%${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✖ Badge not found in README after update${colors.reset}`);
  }
  
  // Done
  console.log(`\n${colors.bright}${colors.green}✓ Demo completed successfully${colors.reset}`);
  console.log(`\n${colors.cyan}ℹ️ To update badge in your project:${colors.reset}`);
  console.log(`  • Run tests: ${colors.dim}npm run test:coverage${colors.reset}`);
  console.log(`  • Update badge: ${colors.dim}npm run coverage:badge${colors.reset}`);
  console.log(`  • Or both together: ${colors.dim}npm run coverage:update${colors.reset}`);
}

// Run the demo if executed directly
if (require.main === module) {
  runDemo().catch(error => {
    console.error(`${colors.red}Demo failed:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { runDemo }; 