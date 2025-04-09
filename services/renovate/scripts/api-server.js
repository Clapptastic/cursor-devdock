const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execPromise = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8099;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to determine update type based on version differences
function determineUpdateType(currentVersion, latestVersion) {
  if (!currentVersion || !latestVersion) return 'patch';
  
  // Remove any leading characters like ^ or ~
  const current = currentVersion.replace(/^\^|~/, '');
  const latest = latestVersion.replace(/^\^|~/, '');
  
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  if (latestParts[0] > currentParts[0]) return 'major';
  if (latestParts[1] > currentParts[1]) return 'minor';
  return 'patch';
}

// API Routes
app.post('/api/scan', async (req, res) => {
  try {
    const { repoPath } = req.body;
    const targetPath = repoPath || process.cwd();
    
    console.log(`Scanning dependencies at: ${targetPath}`);
    
    // Check if package.json exists
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'package.json not found'
      });
    }
    
    // Run npm outdated to get dependency updates
    const { stdout } = await execPromise('npm outdated --json', { 
      cwd: targetPath 
    });
    
    // Parse outdated packages
    const outdatedPackages = JSON.parse(stdout || '{}');
    
    // Format the data for the frontend
    const dependencies = Object.entries(outdatedPackages).map(([name, info]) => {
      const current = info.current;
      const latest = info.latest;
      const updateType = determineUpdateType(current, latest);
      
      return {
        name,
        currentVersion: current,
        latestVersion: latest,
        updateType
      };
    });
    
    return res.json({
      success: true,
      dependencies
    });
  } catch (error) {
    console.error('Error scanning dependencies:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to scan dependencies',
      details: error.message 
    });
  }
});

app.post('/api/update', async (req, res) => {
  try {
    const { dependencies, repoPath } = req.body;
    const targetPath = repoPath || process.cwd();
    
    if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No dependencies specified for update.'
      });
    }
    
    console.log(`Updating dependencies at: ${targetPath}`);
    console.log('Dependencies to update:', dependencies);
    
    // Prepare the dependency list for npm install
    const dependencyList = dependencies
      .map(dep => `${dep.name}@${dep.version || 'latest'}`)
      .join(' ');
    
    // Run npm install with the specified packages
    const { stdout, stderr } = await execPromise(
      `npm install ${dependencyList}`, 
      { cwd: targetPath }
    );
    
    return res.json({
      success: true,
      updated: dependencies.map(dep => dep.name),
      message: `Successfully updated ${dependencies.length} dependencies.`,
      details: {
        stdout,
        stderr
      }
    });
  } catch (error) {
    console.error('Error updating dependencies:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to update dependencies',
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Renovate API server running on port ${PORT}`);
}); 