#!/usr/bin/env node

/**
 * Update README.md with coverage badge
 * 
 * This script reads coverage data and updates the README with
 * a badge showing the current test coverage percentage
 */

const fs = require('fs');
const path = require('path');
const { calculatePercentage } = require('./analyzeCoverage');

// Configuration
const README_PATH = path.join(__dirname, '..', 'README.md');
const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const LCOV_INFO_PATH = path.join(COVERAGE_DIR, 'lcov.info');
const COVERAGE_SUMMARY_PATH = path.join(COVERAGE_DIR, 'coverage-summary.json');
const BADGE_REGEX = /\[!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-([a-z]+)\)\]\(.*\)/;
const BADGE_SECTION_REGEX = /<!-- COVERAGE_BADGE_START -->[\s\S]*?<!-- COVERAGE_BADGE_END -->/;
const DEFAULT_COVERAGE = 0;
const THRESHOLD = 80;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Get coverage percentage from summary json file
 */
function getCoverageFromSummary() {
  try {
    if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
      console.warn(`${colors.yellow}Warning: ${colors.reset}coverage-summary.json not found, trying lcov.info`);
      return null;
    }

    const summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf8'));
    const total = summary.total || {};
    const lines = total.lines || {};
    
    if (lines.total && lines.covered) {
      return calculatePercentage(lines.covered, lines.total);
    }
    
    console.warn(`${colors.yellow}Warning: ${colors.reset}Line coverage data not found in summary`);
    return null;
  } catch (error) {
    console.error(`${colors.red}Error reading coverage summary: ${colors.reset}${error.message}`);
    return null;
  }
}

/**
 * Get coverage percentage from lcov.info file
 */
function getCoverageFromLcov() {
  try {
    if (!fs.existsSync(LCOV_INFO_PATH)) {
      console.error(`${colors.red}Error: ${colors.reset}lcov.info file not found at ${LCOV_INFO_PATH}`);
      return DEFAULT_COVERAGE;
    }

    const lcovContent = fs.readFileSync(LCOV_INFO_PATH, 'utf-8');
    const files = lcovContent.split('end_of_record');
    
    let totalLines = 0;
    let coveredLines = 0;
    
    files.forEach(file => {
      const lines = file.split('\n');
      
      lines.forEach(line => {
        if (line.startsWith('LF:')) {
          totalLines += parseInt(line.substring(3), 10);
        } else if (line.startsWith('LH:')) {
          coveredLines += parseInt(line.substring(3), 10);
        }
      });
    });
    
    return calculatePercentage(coveredLines, totalLines);
  } catch (error) {
    console.error(`${colors.red}Error parsing lcov data: ${colors.reset}${error.message}`);
    return DEFAULT_COVERAGE;
  }
}

/**
 * Get coverage color based on percentage
 */
function getCoverageColor(percentage) {
  if (percentage >= THRESHOLD) return 'brightgreen';
  if (percentage >= THRESHOLD - 15) return 'yellow';
  return 'red';
}

/**
 * Generate coverage badge markdown
 */
function generateBadgeMarkdown(percentage) {
  const color = getCoverageColor(percentage);
  return `[![Coverage](https://img.shields.io/badge/coverage-${percentage}%25-${color})](${path.join('coverage', 'index.html')})`;
}

/**
 * Update README with coverage badge
 */
function updateReadmeWithBadge(percentage) {
  try {
    if (!fs.existsSync(README_PATH)) {
      console.error(`${colors.red}Error: ${colors.reset}README.md not found at ${README_PATH}`);
      return false;
    }

    let readme = fs.readFileSync(README_PATH, 'utf-8');
    const badgeMarkdown = generateBadgeMarkdown(percentage);
    
    // Check if badge section exists
    if (BADGE_SECTION_REGEX.test(readme)) {
      // Update existing badge section
      readme = readme.replace(
        BADGE_SECTION_REGEX, 
        `<!-- COVERAGE_BADGE_START -->\n${badgeMarkdown}\n<!-- COVERAGE_BADGE_END -->`
      );
    } else if (BADGE_REGEX.test(readme)) {
      // Replace existing badge without section markers
      readme = readme.replace(BADGE_REGEX, badgeMarkdown);
    } else {
      // Add badge after first header
      const headerRegex = /^# .*$/m;
      if (headerRegex.test(readme)) {
        readme = readme.replace(
          headerRegex,
          `$&\n\n<!-- COVERAGE_BADGE_START -->\n${badgeMarkdown}\n<!-- COVERAGE_BADGE_END -->`
        );
      } else {
        // Add at the beginning if no header
        readme = `<!-- COVERAGE_BADGE_START -->\n${badgeMarkdown}\n<!-- COVERAGE_BADGE_END -->\n\n${readme}`;
      }
    }
    
    fs.writeFileSync(README_PATH, readme);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error updating README: ${colors.reset}${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  // Get coverage percentage
  let coverage = getCoverageFromSummary();
  
  // Try lcov if summary not available
  if (coverage === null) {
    coverage = getCoverageFromLcov();
  }
  
  // Log coverage
  const coverageColor = coverage >= THRESHOLD ? colors.green : 
                        coverage >= THRESHOLD - 15 ? colors.yellow : colors.red;
  console.log(`${colors.white}Test coverage: ${coverageColor}${coverage}%${colors.reset}`);
  
  // Update README
  const success = updateReadmeWithBadge(coverage);
  
  if (success) {
    console.log(`${colors.green}✓ Coverage badge updated in README.md${colors.reset}`);
  } else {
    console.error(`${colors.red}✖ Failed to update coverage badge${colors.reset}`);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  if (!fs.existsSync(COVERAGE_DIR)) {
    console.error(`${colors.red}Error: ${colors.reset}Coverage directory not found at ${COVERAGE_DIR}`);
    console.error(`Run ${colors.cyan}npm run test:coverage${colors.reset} to generate coverage data.`);
    process.exit(1);
  }
  
  main();
}

module.exports = {
  getCoverageFromSummary,
  getCoverageFromLcov,
  generateBadgeMarkdown,
  updateReadmeWithBadge
}; 