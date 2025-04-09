import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execPromise = promisify(exec);

// Helper function to determine update type based on version differences
function determineUpdateType(currentVersion: string, latestVersion: string): 'patch' | 'minor' | 'major' {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { action } = req.body;

    switch (action) {
      case 'scan':
        try {
          // Get the project root directory (adjust path as needed)
          const projectRoot = path.resolve(process.cwd());
          
          // Read package.json to get current dependencies
          const packageJsonPath = path.join(projectRoot, 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
          
          // Combine all dependencies
          const allDependencies = {
            ...packageJson.dependencies || {},
            ...packageJson.devDependencies || {}
          };
          
          // Use npm to check for outdated packages
          const { stdout } = await execPromise('npm outdated --json', { cwd: projectRoot });
          const outdatedPackages = JSON.parse(stdout || '{}');
          
          // Format the data for the frontend
          const dependencies = Object.entries(outdatedPackages).map(([name, info]: [string, any]) => {
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
          
          return res.status(200).json({
            success: true,
            dependencies
          });
        } catch (error) {
          console.error('Error scanning dependencies:', error);
          return res.status(500).json({ 
            error: 'Failed to scan dependencies', 
            details: error.message 
          });
        }
        
      case 'update':
        try {
          const { dependencies } = req.body;
          
          if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
            return res.status(400).json({ error: 'No dependencies specified for update.' });
          }
          
          // Get the project root directory
          const projectRoot = path.resolve(process.cwd());
          
          // Prepare the dependency list for npm install
          const dependencyList = dependencies.map(dep => 
            `${dep.name}@${dep.version || 'latest'}`
          ).join(' ');
          
          // Run npm install with the specified packages
          const { stdout, stderr } = await execPromise(
            `npm install ${dependencyList}`, 
            { cwd: projectRoot }
          );
          
          return res.status(200).json({
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
            error: 'Failed to update dependencies', 
            details: error.message 
          });
        }
        
      default:
        return res.status(400).json({ error: 'Invalid action. Supported actions: scan, update' });
    }
  } catch (error) {
    console.error('Error in renovate API:', error);
    return res.status(500).json({ 
      error: 'Internal server error.', 
      details: error.message 
    });
  }
} 