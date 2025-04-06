const { execSync } = require('child_process');
const path = require('path');

/**
 * Run ESLint on the codebase
 */
const runLint = () => {
  console.log('Running ESLint...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('ESLint completed successfully!');
  } catch (error) {
    console.error('ESLint found issues.');
    process.exit(1);
  }
};

runLint(); 