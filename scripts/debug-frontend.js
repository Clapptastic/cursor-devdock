#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { exec } from 'child_process';

// Check if we're in the project root
function isProjectRoot(dir) {
  return fs.existsSync(path.join(dir, 'package.json'));
}

let currentDir = process.cwd();
if (!isProjectRoot(currentDir)) {
  console.error(chalk.red('Error: Please run this script from the project root directory.'));
  process.exit(1);
}

console.log(chalk.blue('==================================='));
console.log(chalk.blue('Customer Survey Platform Debugger'));
console.log(chalk.blue('==================================='));
console.log();

// Check if Docker is installed and running
function checkDocker() {
  return new Promise((resolve) => {
    exec('docker --version', (error) => {
      if (error) {
        console.log(chalk.yellow('Docker not found. Docker debugging mode will not be available.'));
        resolve(false);
      } else {
        exec('docker ps', (error) => {
          if (error) {
            console.log(chalk.yellow('Docker is installed but not running. Please start Docker to use Docker debugging mode.'));
            resolve(false);
          } else {
            resolve(true);
          }
        });
      }
    });
  });
}

// Check for port conflicts
function checkPortConflicts(port = 8080) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `netstat -an | findstr :${port}` 
      : `lsof -i:${port}`;
    
    exec(command, (error, stdout) => {
      if (error) {
        // If the command fails, it likely means nothing is using the port
        resolve(false);
      } else {
        // If there's output, something is using the port
        if (stdout.trim()) {
          console.log(chalk.red(`Warning: Port ${port} is already in use. Docker container might fail to start.`));
          console.log(chalk.yellow(`Output: ${stdout.trim()}`));
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

// Create debug.html if it doesn't exist
const debugHtmlPath = path.join(currentDir, 'src', 'frontend', 'debug.html');
if (!fs.existsSync(debugHtmlPath)) {
  console.log(chalk.yellow('Creating debug.html file...'));
  
  // Check if the directory exists, create it if not
  const debugDirPath = path.join(currentDir, 'src', 'frontend');
  if (!fs.existsSync(debugDirPath)) {
    fs.mkdirSync(debugDirPath, { recursive: true });
  }
  
  // Create a minimal debug.html file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Survey Platform - Debug Mode</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #4361ee; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .btn { background-color: #4361ee; color: white; padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Customer Survey Platform - Debug Mode</h1>
    <p>This is a simplified debug page. For more tools, use the Docker debugging environment.</p>
    <div>
        <button class="btn" onclick="console.log('Debug test: ' + new Date().toISOString())">Test Console Log</button>
    </div>
    <pre id="debug-output">// Debug output will appear here</pre>
    <script>
        console.log('Debug mode initialized at ' + new Date().toISOString());
        document.getElementById('debug-output').textContent = 'Debug initialized at ' + new Date().toISOString();
    </script>
</body>
</html>`;
  
  fs.writeFileSync(debugHtmlPath, htmlContent);
  console.log(chalk.green('Created debug.html file at: ') + debugHtmlPath);
}

// Check for .env file and create one if it doesn't exist
const envPath = path.join(currentDir, '.env');
const envExamplePath = path.join(currentDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log(chalk.yellow('Creating .env file from .env.example...'));
  fs.copyFileSync(envExamplePath, envPath);
  console.log(chalk.green('Created .env file. Please update it with your credentials.'));
}

async function runDebug() {
  // Ask for command line argument for debugging method
  const debuggingMethod = process.argv[2] || 'docker';

  if (debuggingMethod === 'docker' || debuggingMethod === 'd') {
    const dockerAvailable = await checkDocker();
    
    if (!dockerAvailable) {
      console.log(chalk.red('Docker is not available. Please install and start Docker, or use browser debugging mode.'));
      console.log(chalk.yellow('Run with: npm run frontend:debug -- browser'));
      process.exit(1);
    }
    
    // Check for port conflicts
    const portConflict = await checkPortConflicts(8080);
    if (portConflict) {
      console.log(chalk.yellow('You can change the port in docker-compose.frontend.yml if needed.'));
    }
    
    console.log(chalk.blue('Starting debugging environment using Docker...'));
    
    // Check if Docker Compose file exists
    const dockerComposePath = path.join(currentDir, 'docker-compose.frontend.yml');
    if (!fs.existsSync(dockerComposePath)) {
      console.log(chalk.red('Error: docker-compose.frontend.yml not found.'));
      console.log('Creating a minimal Docker Compose file...');
      
      const minimalDockerCompose = `version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: survey-frontend
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=development
      - DEBUG=true
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./src/frontend:/usr/share/nginx/html/frontend-source
    networks:
      - survey-network
    restart: unless-stopped

networks:
  survey-network:
    driver: bridge`;
      
      fs.writeFileSync(dockerComposePath, minimalDockerCompose);
      console.log(chalk.green('Created docker-compose.frontend.yml file.'));
    }
    
    console.log('Starting docker-compose with frontend service...');
    
    // Use docker-compose with --force-recreate to ensure a fresh container
    const dockerProcess = spawn('docker-compose', [
      '-f', 'docker-compose.frontend.yml', 
      'up', 
      '--build',
      '--force-recreate',
      'frontend'
    ], { stdio: 'inherit' });
    
    dockerProcess.on('error', (err) => {
      console.error(chalk.red(`Error starting Docker: ${err.message}`));
      console.log(chalk.yellow('Make sure Docker is installed and running.'));
      process.exit(1);
    });
    
    console.log(chalk.green('Docker container is starting...'));
    console.log(chalk.green('Once started, access debugging at:'));
    console.log('  - Main app: ' + chalk.cyan('http://localhost:8080/'));
    console.log('  - Debug tools: ' + chalk.cyan('http://localhost:8080/debug-tools/'));
    console.log('  - Source browser: ' + chalk.cyan('http://localhost:8080/debug/'));
    console.log('  - Health check: ' + chalk.cyan('http://localhost:8080/health'));
    
    // Display troubleshooting info
    console.log('\n' + chalk.yellow('Troubleshooting:'));
    console.log('- If the container fails to start, check Docker logs with: ' + 
                chalk.cyan('docker logs survey-frontend'));
    console.log('- To stop the container: ' + chalk.cyan('docker-compose -f docker-compose.frontend.yml down'));
    console.log('- If port 8080 is in use, edit docker-compose.frontend.yml to use a different port');
    
  } else if (debuggingMethod === 'browser' || debuggingMethod === 'b') {
    console.log(chalk.blue('Opening debug.html in browser...'));
    
    // Open debug.html in default browser
    let openCommand;
    let openArgs;
    
    switch (process.platform) {
      case 'darwin': // macOS
        openCommand = 'open';
        openArgs = [debugHtmlPath];
        break;
      case 'win32': // Windows
        openCommand = 'cmd';
        openArgs = ['/c', 'start', debugHtmlPath];
        break;
      default: // Linux and others
        openCommand = 'xdg-open';
        openArgs = [debugHtmlPath];
    }
    
    try {
      const open = spawn(openCommand, openArgs, { 
        stdio: 'ignore',
        detached: true
      });
      open.unref();
      console.log(chalk.green('Debug page opened in browser'));
    } catch (err) {
      console.error(chalk.red(`Error opening browser: ${err.message}`));
      console.log(chalk.yellow(`Manually open: ${debugHtmlPath}`));
    }
  } else {
    console.log(chalk.green('Debugging files prepared successfully.'));
    console.log(chalk.blue(`Debug HTML file location: ${debugHtmlPath}`));
    console.log(chalk.yellow('Open this file in your browser to start debugging.'));
    console.log('');
    console.log(chalk.blue('Usage:'));
    console.log('  npm run frontend:debug            - Use Docker for debugging (default)');
    console.log('  npm run frontend:debug -- browser - Open debug.html in browser');
    console.log('  npm run frontend:debug -- files   - Just prepare debug files');
  }
}

// Run the debug process
runDebug().catch(err => {
  console.error(chalk.red(`Error during debugging setup: ${err.message}`));
  console.error(err.stack);
  process.exit(1);
}); 