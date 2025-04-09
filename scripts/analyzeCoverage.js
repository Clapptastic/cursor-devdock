#!/usr/bin/env node

/**
 * Analyze test coverage and generate a report summary
 * This script reads the coverage data from Istanbul and outputs a formatted report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Configuration
const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const LCOV_INFO_PATH = path.join(COVERAGE_DIR, 'lcov.info');
const COVERAGE_SUMMARY_PATH = path.join(COVERAGE_DIR, 'coverage-summary.json');
const THRESHOLD = {
  lines: 80,
  statements: 80,
  functions: 75,
  branches: 70
};

/**
 * Parse the lcov.info file to extract coverage data
 */
function parseLcovInfo() {
  try {
    if (!fs.existsSync(LCOV_INFO_PATH)) {
      console.error(`${colors.red}Error: ${colors.reset}lcov.info file not found at ${LCOV_INFO_PATH}`);
      console.error(`Run ${colors.cyan}npm run test:coverage${colors.reset} to generate coverage data.`);
      process.exit(1);
    }

    const lcovContent = fs.readFileSync(LCOV_INFO_PATH, 'utf-8');
    const files = lcovContent.split('end_of_record');
    
    const coverage = {
      files: [],
      summary: {
        lines: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 }
      }
    };
    
    files.forEach(file => {
      const lines = file.split('\n');
      const fileData = {};
      
      lines.forEach(line => {
        if (line.startsWith('SF:')) {
          fileData.path = line.substring(3);
          fileData.name = path.basename(fileData.path);
        } else if (line.startsWith('FNF:')) {
          fileData.functions = fileData.functions || { total: 0, covered: 0 };
          fileData.functions.total = parseInt(line.substring(4), 10);
        } else if (line.startsWith('FNH:')) {
          fileData.functions = fileData.functions || { total: 0, covered: 0 };
          fileData.functions.covered = parseInt(line.substring(4), 10);
        } else if (line.startsWith('LF:')) {
          fileData.lines = fileData.lines || { total: 0, covered: 0 };
          fileData.lines.total = parseInt(line.substring(3), 10);
        } else if (line.startsWith('LH:')) {
          fileData.lines = fileData.lines || { total: 0, covered: 0 };
          fileData.lines.covered = parseInt(line.substring(3), 10);
        } else if (line.startsWith('BRF:')) {
          fileData.branches = fileData.branches || { total: 0, covered: 0 };
          fileData.branches.total = parseInt(line.substring(4), 10);
        } else if (line.startsWith('BRH:')) {
          fileData.branches = fileData.branches || { total: 0, covered: 0 };
          fileData.branches.covered = parseInt(line.substring(4), 10);
        }
      });
      
      if (fileData.path) {
        fileData.directory = path.dirname(fileData.path).replace(/^.*\/src\//, 'src/');
        coverage.files.push(fileData);
        
        // Add to summary
        coverage.summary.lines.total += fileData.lines?.total || 0;
        coverage.summary.lines.covered += fileData.lines?.covered || 0;
        coverage.summary.functions.total += fileData.functions?.total || 0;
        coverage.summary.functions.covered += fileData.functions?.covered || 0;
        coverage.summary.branches.total += fileData.branches?.total || 0;
        coverage.summary.branches.covered += fileData.branches?.covered || 0;
      }
    });
    
    // Calculate statements from lines (approximation)
    coverage.summary.statements.total = coverage.summary.lines.total;
    coverage.summary.statements.covered = coverage.summary.lines.covered;
    
    return coverage;
  } catch (error) {
    console.error(`${colors.red}Error parsing coverage data:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Calculate coverage percentage
 */
function calculatePercentage(covered, total) {
  if (total === 0) return 100; // If no items to cover, consider 100% covered
  return Math.round((covered / total) * 100);
}

/**
 * Get color for coverage percentage
 */
function getColorForPercentage(percentage, threshold = 80) {
  if (percentage >= threshold) return colors.green;
  if (percentage >= threshold - 15) return colors.yellow;
  return colors.red;
}

/**
 * Format coverage percentage with color
 */
function formatPercentage(percentage, threshold = 80) {
  const color = getColorForPercentage(percentage, threshold);
  return `${color}${percentage}%${colors.reset}`;
}

/**
 * Print directory summary
 */
function printDirectorySummary(coverage) {
  // Group files by directory
  const dirs = {};
  coverage.files.forEach(file => {
    if (!dirs[file.directory]) {
      dirs[file.directory] = {
        files: [],
        lines: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 }
      };
    }
    
    dirs[file.directory].files.push(file);
    dirs[file.directory].lines.total += file.lines?.total || 0;
    dirs[file.directory].lines.covered += file.lines?.covered || 0;
    dirs[file.directory].functions.total += file.functions?.total || 0;
    dirs[file.directory].functions.covered += file.functions?.covered || 0;
    dirs[file.directory].branches.total += file.branches?.total || 0;
    dirs[file.directory].branches.covered += file.branches?.covered || 0;
  });
  
  console.log(`\n${colors.bright}${colors.white}Coverage by Directory:${colors.reset}\n`);
  console.log('╔════════════════════════════════╤═══════════╤════════════╤═══════════╗');
  console.log('║ Directory                      │   Lines   │ Functions  │ Branches  ║');
  console.log('╟────────────────────────────────┼───────────┼────────────┼───────────╢');
  
  Object.keys(dirs).sort().forEach(dir => {
    const dirData = dirs[dir];
    const linesPercent = calculatePercentage(dirData.lines.covered, dirData.lines.total);
    const functionsPercent = calculatePercentage(dirData.functions.covered, dirData.functions.total);
    const branchesPercent = calculatePercentage(dirData.branches.covered, dirData.branches.total);
    
    const linesCoverage = formatPercentage(linesPercent);
    const functionsCoverage = formatPercentage(functionsPercent, THRESHOLD.functions);
    const branchesCoverage = formatPercentage(branchesPercent, THRESHOLD.branches);
    
    console.log(`║ ${dir.padEnd(30)} │ ${linesCoverage.padEnd(9)} │ ${functionsCoverage.padEnd(10)} │ ${branchesCoverage.padEnd(9)} ║`);
  });
  
  console.log('╚════════════════════════════════╧═══════════╧════════════╧═══════════╝');
}

/**
 * Print summary table
 */
function printSummaryTable(coverage) {
  const linesPercent = calculatePercentage(coverage.summary.lines.covered, coverage.summary.lines.total);
  const statementsPercent = calculatePercentage(coverage.summary.statements.covered, coverage.summary.statements.total);
  const functionsPercent = calculatePercentage(coverage.summary.functions.covered, coverage.summary.functions.total);
  const branchesPercent = calculatePercentage(coverage.summary.branches.covered, coverage.summary.branches.total);
  
  const linesCoverage = formatPercentage(linesPercent);
  const statementsCoverage = formatPercentage(statementsPercent);
  const functionsCoverage = formatPercentage(functionsPercent, THRESHOLD.functions);
  const branchesCoverage = formatPercentage(branchesPercent, THRESHOLD.branches);
  
  console.log(`\n${colors.bright}${colors.white}Overall Coverage Summary:${colors.reset}\n`);
  console.log('╔═════════════╤═══════════╤═══════════╤════════════╤═══════════╗');
  console.log('║             │   Lines   │ Statements │ Functions  │ Branches  ║');
  console.log('╟─────────────┼───────────┼───────────┼────────────┼───────────╢');
  console.log(`║ Coverage    │ ${linesCoverage.padEnd(9)} │ ${statementsCoverage.padEnd(9)} │ ${functionsCoverage.padEnd(10)} │ ${branchesCoverage.padEnd(9)} ║`);
  console.log(`║ Threshold   │ ${colors.cyan}${THRESHOLD.lines}%${colors.reset.padEnd(6)} │ ${colors.cyan}${THRESHOLD.statements}%${colors.reset.padEnd(6)} │ ${colors.cyan}${THRESHOLD.functions}%${colors.reset.padEnd(7)} │ ${colors.cyan}${THRESHOLD.branches}%${colors.reset.padEnd(6)} ║`);
  console.log('╚═════════════╧═══════════╧═══════════╧════════════╧═══════════╝');
  
  // Print files count
  console.log(`\n${colors.white}Total Files: ${colors.reset}${coverage.files.length}`);
  
  // Print coverage report location
  console.log(`\n${colors.white}Detailed HTML report: ${colors.reset}${colors.cyan}${path.join(COVERAGE_DIR, 'index.html')}${colors.reset}`);
}

/**
 * Print uncovered files
 */
function printUncoveredFiles(coverage) {
  const lowCoverageFiles = coverage.files.filter(file => {
    const linesPercent = calculatePercentage(file.lines?.covered || 0, file.lines?.total || 0);
    return linesPercent < THRESHOLD.lines;
  }).sort((a, b) => {
    const aPercent = calculatePercentage(a.lines?.covered || 0, a.lines?.total || 0);
    const bPercent = calculatePercentage(b.lines?.covered || 0, b.lines?.total || 0);
    return aPercent - bPercent;
  });
  
  if (lowCoverageFiles.length > 0) {
    console.log(`\n${colors.bright}${colors.yellow}Files below ${THRESHOLD.lines}% line coverage:${colors.reset}\n`);
    
    console.log('╔════════════════════════════════════════════╤═══════════╤════════════╗');
    console.log('║ File                                       │   Lines   │ Missing    ║');
    console.log('╟────────────────────────────────────────────┼───────────┼────────────╢');
    
    lowCoverageFiles.slice(0, 10).forEach(file => {
      const linesPercent = calculatePercentage(file.lines?.covered || 0, file.lines?.total || 0);
      const linesMissing = (file.lines?.total || 0) - (file.lines?.covered || 0);
      console.log(`║ ${file.path.padEnd(46)} │ ${formatPercentage(linesPercent).padEnd(9)} │ ${String(linesMissing).padEnd(10)} ║`);
    });
    
    if (lowCoverageFiles.length > 10) {
      console.log(`║ ${colors.dim}... and ${lowCoverageFiles.length - 10} more files${colors.reset.padEnd(35)} │           │            ║`);
    }
    
    console.log('╚════════════════════════════════════════════╧═══════════╧════════════╝');
  }
}

/**
 * Print coverage badges
 */
function printCoverageBadges(coverage) {
  const linesPercent = calculatePercentage(coverage.summary.lines.covered, coverage.summary.lines.total);
  
  console.log(`\n${colors.bright}${colors.white}Badge for README:${colors.reset}\n`);
  console.log(`[![Coverage](https://img.shields.io/badge/coverage-${linesPercent}%25-${linesPercent >= THRESHOLD.lines ? 'brightgreen' : linesPercent >= THRESHOLD.lines - 15 ? 'yellow' : 'red'})](${path.join(COVERAGE_DIR, 'index.html')})`);
}

/**
 * Check if coverage meets thresholds
 */
function checkThresholds(coverage) {
  const linesPercent = calculatePercentage(coverage.summary.lines.covered, coverage.summary.lines.total);
  const statementsPercent = calculatePercentage(coverage.summary.statements.covered, coverage.summary.statements.total);
  const functionsPercent = calculatePercentage(coverage.summary.functions.covered, coverage.summary.functions.total);
  const branchesPercent = calculatePercentage(coverage.summary.branches.covered, coverage.summary.branches.total);
  
  let failures = 0;
  
  if (linesPercent < THRESHOLD.lines) {
    console.log(`\n${colors.red}✖ Line coverage (${linesPercent}%) is below threshold (${THRESHOLD.lines}%)${colors.reset}`);
    failures++;
  }
  
  if (statementsPercent < THRESHOLD.statements) {
    console.log(`\n${colors.red}✖ Statement coverage (${statementsPercent}%) is below threshold (${THRESHOLD.statements}%)${colors.reset}`);
    failures++;
  }
  
  if (functionsPercent < THRESHOLD.functions) {
    console.log(`\n${colors.red}✖ Function coverage (${functionsPercent}%) is below threshold (${THRESHOLD.functions}%)${colors.reset}`);
    failures++;
  }
  
  if (branchesPercent < THRESHOLD.branches) {
    console.log(`\n${colors.red}✖ Branch coverage (${branchesPercent}%) is below threshold (${THRESHOLD.branches}%)${colors.reset}`);
    failures++;
  }
  
  if (failures === 0) {
    console.log(`\n${colors.green}✓ All coverage thresholds passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}ℹ Run specific tests with: ${colors.cyan}npm test -- --selectProjects=backend${colors.reset}`);
    console.log(`${colors.yellow}ℹ Generate coverage for specific components: ${colors.cyan}npm run test:backup:coverage${colors.reset}`);
  }
  
  return failures === 0;
}

/**
 * Generate recommendations for improving coverage
 */
function generateRecommendations(coverage) {
  const lowCoverageFiles = coverage.files.filter(file => {
    const linesPercent = calculatePercentage(file.lines?.covered || 0, file.lines?.total || 0);
    return linesPercent < THRESHOLD.lines;
  }).sort((a, b) => {
    const aMissing = (a.lines?.total || 0) - (a.lines?.covered || 0);
    const bMissing = (b.lines?.total || 0) - (b.lines?.covered || 0);
    return bMissing - aMissing; // Sort by most missing lines first
  });
  
  if (lowCoverageFiles.length > 0) {
    console.log(`\n${colors.bright}${colors.white}Recommendations to improve coverage:${colors.reset}\n`);
    
    // Focus on top 3 files with most missing lines
    const topFiles = lowCoverageFiles.slice(0, 3);
    
    topFiles.forEach(file => {
      const linesMissing = (file.lines?.total || 0) - (file.lines?.covered || 0);
      const linesPercent = calculatePercentage(file.lines?.covered || 0, file.lines?.total || 0);
      console.log(`${colors.bright}${colors.blue}→ ${file.path}${colors.reset} (${formatPercentage(linesPercent)}, missing ${linesMissing} lines)`);
      
      // Determine file type to give specific recommendations
      if (file.path.includes('controller')) {
        console.log(`  ${colors.dim}• Add tests for error conditions and edge cases${colors.reset}`);
        console.log(`  ${colors.dim}• Test authentication and authorization failures${colors.reset}`);
        console.log(`  ${colors.dim}• Create a test file at ${file.path.replace(/\.js$/, '.test.js').replace(/src\//, 'src/tests/')}${colors.reset}`);
      } else if (file.path.includes('middleware')) {
        console.log(`  ${colors.dim}• Mock requests and responses to test middleware${colors.reset}`);
        console.log(`  ${colors.dim}• Test both success and failure paths${colors.reset}`);
      } else if (file.path.includes('model')) {
        console.log(`  ${colors.dim}• Add tests for model validation and methods${colors.reset}`);
        console.log(`  ${colors.dim}• Create mock data to test schema constraints${colors.reset}`);
      } else if (file.path.includes('util') || file.path.includes('helper')) {
        console.log(`  ${colors.dim}• Add unit tests for each utility function${colors.reset}`);
        console.log(`  ${colors.dim}• Test with a variety of inputs and edge cases${colors.reset}`);
      }
    });
    
    console.log(`\n${colors.yellow}ℹ Improving these files could add ${topFiles.reduce((sum, file) => sum + ((file.lines?.total || 0) - (file.lines?.covered || 0)), 0)} covered lines${colors.reset}`);
  }
}

/**
 * Main function
 */
function main() {
  // Check if coverage data exists
  if (!fs.existsSync(COVERAGE_DIR)) {
    console.error(`${colors.red}Error: ${colors.reset}Coverage directory not found at ${COVERAGE_DIR}`);
    console.error(`Run ${colors.cyan}npm run test:coverage${colors.reset} to generate coverage data.`);
    process.exit(1);
  }
  
  console.log(`${colors.bright}${colors.white}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.white}║           Test Coverage Analysis         ║${colors.reset}`);
  console.log(`${colors.bright}${colors.white}╚══════════════════════════════════════════╝${colors.reset}`);
  
  // Parse coverage data
  const coverage = parseLcovInfo();
  
  // Print directory summary
  printDirectorySummary(coverage);
  
  // Print summary table
  printSummaryTable(coverage);
  
  // Print uncovered files
  printUncoveredFiles(coverage);
  
  // Print coverage badges
  printCoverageBadges(coverage);
  
  // Generate recommendations
  generateRecommendations(coverage);
  
  // Check thresholds
  const passed = checkThresholds(coverage);
  
  // Exit with appropriate code
  process.exit(passed ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseLcovInfo,
  calculatePercentage,
  checkThresholds
}; 