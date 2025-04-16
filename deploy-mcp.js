const fs = require('fs');
const path = require('path');
const express = require('express');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('server', {
    alias: 's',
    type: 'string',
    description: 'Server ID to deploy'
  })
  .option('all', {
    alias: 'a',
    type: 'boolean',
    description: 'Deploy all servers'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Load configuration
const configPath = path.join(__dirname, 'mcp-servers', 'mcp-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Class to implement MCP Server functionality
class MCPServer {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.port = config.port;
    this.host = config.host;
    this.logEnabled = config.logEnabled;
    this.timeout = config.timeout;
    this.maxConnections = config.maxConnections;
    this.retryAttempts = config.retryAttempts;
    this.app = express();
    this.server = null;
    this.setupRoutes();
  }

  setupRoutes() {
    // Log requests if logging is enabled
    if (this.logEnabled) {
      this.app.use((req, res, next) => {
        console.log(`[${this.name}] ${req.method} ${req.url}`);
        next();
      });
    }

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', server: this.name });
    });

    // MCP status endpoint
    this.app.get('/status', (req, res) => {
      res.status(200).json({
        id: this.id,
        name: this.name,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      });
    });

    // Sample MCP API endpoint
    this.app.post('/api/process', (req, res) => {
      res.status(200).json({
        success: true,
        message: `Processed by MCP server: ${this.name}`,
        timestamp: new Date().toISOString()
      });
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error(`[${this.name}] Error:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, this.host, () => {
          if (this.logEnabled) {
            console.log(`MCP server ${this.name} started on ${this.host}:${this.port}`);
          }
          resolve();
        });
        
        // Set connection timeout
        this.server.timeout = this.timeout;
        
        // Handle server errors
        this.server.on('error', (err) => {
          console.error(`[${this.name}] Server error:`, err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            console.error(`[${this.name}] Error stopping server:`, err);
            reject(err);
          } else {
            if (this.logEnabled) {
              console.log(`MCP server ${this.name} stopped`);
            }
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Function to deploy a single server
const deployServer = (serverConfig) => {
  console.log(`Deploying MCP server: ${serverConfig.name} (${serverConfig.id})`);
  
  const server = new MCPServer({
    id: serverConfig.id,
    name: serverConfig.name,
    port: serverConfig.port,
    host: serverConfig.host,
    logEnabled: serverConfig.enableLogging,
    timeout: config.globalConfig.timeout,
    maxConnections: config.globalConfig.maxConnections,
    retryAttempts: config.globalConfig.retryAttempts
  });

  server.start()
    .then(() => {
      console.log(`MCP server ${serverConfig.name} started successfully on ${serverConfig.host}:${serverConfig.port}`);
    })
    .catch(err => {
      console.error(`Failed to start MCP server ${serverConfig.name}:`, err);
    });

  return server;
};

// Main function to deploy servers
const deployServers = () => {
  const servers = [];
  
  if (argv.all) {
    // Deploy all servers
    config.servers.forEach(serverConfig => {
      servers.push(deployServer(serverConfig));
    });
  } else if (argv.server) {
    // Deploy specific server
    const serverConfig = config.servers.find(s => s.id === argv.server);
    if (serverConfig) {
      servers.push(deployServer(serverConfig));
    } else {
      console.error(`Server with ID ${argv.server} not found in configuration.`);
      process.exit(1);
    }
  } else {
    // Default behavior: deploy all servers
    config.servers.forEach(serverConfig => {
      servers.push(deployServer(serverConfig));
    });
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down MCP servers...');
    Promise.all(servers.map(server => server.stop()))
      .then(() => {
        console.log('All MCP servers stopped.');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error stopping servers:', err);
        process.exit(1);
      });
  });
};

// Start deployment
deployServers();