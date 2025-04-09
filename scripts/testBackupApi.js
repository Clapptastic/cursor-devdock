#!/usr/bin/env node

/**
 * Test script for the backup API
 * Demonstrates how to use the backup API endpoints
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// API configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TOKEN = process.env.API_TOKEN; // Admin JWT token

// Check if token is available
if (!TOKEN) {
  console.error('❌ API_TOKEN is not set in .env file');
  console.error('Please add an admin user JWT token to the .env file:');
  console.error('API_TOKEN=your-jwt-token');
  process.exit(1);
}

// Set up axios with authorization header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * List all backups
 */
async function listBackups() {
  try {
    console.log('📋 Listing backups...');
    const response = await api.get('/backups');
    console.log(`✅ Found ${response.data.count} backups:`);
    
    const backups = response.data.data || [];
    backups.forEach(backup => {
      console.log(`  - ${backup.name} (${backup.sizeFormatted}) - ${new Date(backup.created).toLocaleString()}`);
    });
    
    return backups;
  } catch (error) {
    console.error('❌ Error listing backups:', error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Create a new backup
 */
async function createBackup() {
  try {
    console.log('💾 Creating new backup...');
    const response = await api.post('/backups', {
      gzip: true
    });
    
    console.log(`✅ Backup created: ${response.data.data.path}`);
    return response.data.data.path;
  } catch (error) {
    console.error('❌ Error creating backup:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Run a scheduled backup
 */
async function runScheduledBackup() {
  try {
    console.log('🔄 Running scheduled backup...');
    const response = await api.post('/backups/scheduled', {
      retentionDays: 7,
      maxBackups: 5,
      gzip: true
    });
    
    console.log(`✅ Scheduled backup created: ${response.data.data.path}`);
    console.log('   Old backups cleaned up according to retention policy');
    return response.data.data.path;
  } catch (error) {
    console.error('❌ Error running scheduled backup:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Delete a backup
 */
async function deleteBackup(name) {
  if (!name) {
    console.error('❌ Backup name is required');
    return false;
  }
  
  try {
    console.log(`🗑️ Deleting backup: ${name}...`);
    const response = await api.delete(`/backups/${name}`);
    
    console.log(`✅ Backup deleted: ${name}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting backup:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Restore from a backup
 */
async function restoreBackup(path) {
  if (!path) {
    console.error('❌ Backup path is required');
    return false;
  }
  
  try {
    console.log(`📥 Restoring from backup: ${path}...`);
    const response = await api.post('/backups/restore', {
      backupPath: path,
      drop: false
    });
    
    console.log(`✅ Database restored from: ${path}`);
    return true;
  } catch (error) {
    console.error('❌ Error restoring backup:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Run a demonstration of the backup API
 */
async function runDemo() {
  console.log('🚀 Starting Backup API Demo');
  console.log('===========================');
  
  // Step 1: List existing backups
  const existingBackups = await listBackups();
  console.log('---------------------------');
  
  // Step 2: Create a new backup
  const newBackupPath = await createBackup();
  console.log('---------------------------');
  
  // Step 3: List backups again to show the new one
  if (newBackupPath) {
    await listBackups();
    console.log('---------------------------');
  }
  
  // Step 4: Run a scheduled backup
  await runScheduledBackup();
  console.log('---------------------------');
  
  // Step 5: List all backups
  const allBackups = await listBackups();
  console.log('---------------------------');
  
  // Step 6: Delete the first backup if available
  if (allBackups.length > 0) {
    await deleteBackup(allBackups[0].name);
    console.log('---------------------------');
    
    // Step 7: List backups again to show the deletion
    await listBackups();
    console.log('---------------------------');
  }
  
  console.log('✨ Demo completed');
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}

module.exports = {
  listBackups,
  createBackup,
  runScheduledBackup,
  deleteBackup,
  restoreBackup,
  runDemo
}; 