#!/usr/bin/env node

/**
 * A utility script to update Swagger documentation.
 * This can be expanded to automatically generate documentation from code comments
 * or merge multiple documentation files.
 */

const fs = require('fs');
const path = require('path');

// Paths to documentation files
const docsPath = path.join(__dirname, '..', 'backend', 'docs');
const swaggerFilePath = path.join(docsPath, 'swagger.json');

/**
 * Updates the version number in the Swagger documentation
 */
function updateVersion() {
  try {
    // Read the current Swagger file
    const swaggerDoc = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));
    
    // Get the package.json to sync version numbers
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
    
    // Update the version
    swaggerDoc.info.version = packageJson.version;
    
    // Add a timestamp for documentation freshness
    const now = new Date();
    swaggerDoc.info.description = swaggerDoc.info.description || 'API for the AI-powered customer survey system';
    swaggerDoc.info.description += `\n\nLast updated: ${now.toISOString()}`;
    
    // Write the updated file
    fs.writeFileSync(swaggerFilePath, JSON.stringify(swaggerDoc, null, 2));
    
    console.log(`✅ Updated Swagger API documentation to version ${packageJson.version}`);
  } catch (error) {
    console.error('❌ Error updating Swagger documentation:', error.message);
    process.exit(1);
  }
}

/**
 * Validates the Swagger documentation for basic structural issues
 */
function validateSwagger() {
  try {
    // Read the current Swagger file
    const swaggerDoc = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));
    
    // Basic validation checks
    if (!swaggerDoc.openapi) {
      console.warn('⚠️ Warning: OpenAPI version not specified');
    }
    
    if (!swaggerDoc.info || !swaggerDoc.info.title) {
      console.warn('⚠️ Warning: API title not specified');
    }
    
    if (!swaggerDoc.paths || Object.keys(swaggerDoc.paths).length === 0) {
      console.warn('⚠️ Warning: No API paths defined');
    }
    
    console.log('✅ Swagger documentation validation passed');
  } catch (error) {
    console.error('❌ Error validating Swagger documentation:', error.message);
    process.exit(1);
  }
}

// Execute functions based on command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'update';

switch (command) {
  case 'update':
    updateVersion();
    validateSwagger();
    break;
  case 'validate':
    validateSwagger();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Available commands: update, validate');
    process.exit(1);
}

// If script is run directly
if (require.main === module) {
  console.log('📚 Swagger documentation updated successfully');
}

module.exports = {
  updateVersion,
  validateSwagger
}; 