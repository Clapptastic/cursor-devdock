const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');
const winston = require('winston');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// App configuration
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8004;
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Browser Tools API',
      version: '1.0.0',
      description: 'Browser Tools API Documentation for Cursor DevDock',
      contact: {
        name: 'Cursor DevDock'
      },
      servers: [
        {
          url: `http://localhost:${PORT}`
        }
      ]
    },
    components: {
      schemas: {
        BrowserLog: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL where the log was generated'
            },
            event: {
              type: 'string',
              description: 'Event type'
            },
            details: {
              type: 'object',
              description: 'Additional details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Log timestamp'
            }
          }
        },
        ConsoleError: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL where the error occurred'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            stack: {
              type: 'string',
              description: 'Error stack trace'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        NetworkError: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL of the failed request'
            },
            status: {
              type: 'integer',
              description: 'HTTP status code'
            },
            statusText: {
              type: 'string',
              description: 'HTTP status text'
            },
            method: {
              type: 'string',
              description: 'HTTP method'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        NetworkLog: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL of the request'
            },
            method: {
              type: 'string',
              description: 'HTTP method'
            },
            status: {
              type: 'integer',
              description: 'HTTP status code'
            },
            duration: {
              type: 'integer',
              description: 'Request duration in milliseconds'
            },
            size: {
              type: 'integer',
              description: 'Response size in bytes'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Log timestamp'
            }
          }
        }
      }
    }
  },
  apis: ['./index.js'], // path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// In-memory storage for logs
const logs = {
  browserLogs: [],
  consoleErrors: [],
  networkErrors: [],
  networkLogs: []
};

// Maximum number of logs to keep in memory
const MAX_LOGS = 1000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket connection handling
wss.on('connection', (ws) => {
  logger.info('Client connected to WebSocket');
  
  // Send current logs to new client
  ws.send(JSON.stringify({
    type: 'init',
    data: logs
  }));
  
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    logger.info('Client disconnected from WebSocket');
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Helper function to add log and maintain max size
function addLog(logType, logData) {
  logs[logType].unshift({
    ...logData,
    timestamp: logData.timestamp || new Date().toISOString()
  });
  
  // Maintain max size
  if (logs[logType].length > MAX_LOGS) {
    logs[logType] = logs[logType].slice(0, MAX_LOGS);
  }
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    connections: wss.clients.size,
    logCounts: {
      browserLogs: logs.browserLogs.length,
      consoleErrors: logs.consoleErrors.length,
      networkErrors: logs.networkErrors.length,
      networkLogs: logs.networkLogs.length
    }
  });
});

// API endpoints for logs
app.post('/api/logs/browser', (req, res) => {
  try {
    const logData = req.body;
    addLog('browserLogs', logData);
    broadcast({ type: 'browserLog', data: logData });
    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error adding browser log:', error);
    res.status(500).json({ error: 'Failed to add browser log' });
  }
});

app.post('/api/logs/console-error', (req, res) => {
  try {
    const errorData = req.body;
    addLog('consoleErrors', errorData);
    broadcast({ type: 'consoleError', data: errorData });
    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error adding console error:', error);
    res.status(500).json({ error: 'Failed to add console error' });
  }
});

app.post('/api/logs/network-error', (req, res) => {
  try {
    const errorData = req.body;
    addLog('networkErrors', errorData);
    broadcast({ type: 'networkError', data: errorData });
    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error adding network error:', error);
    res.status(500).json({ error: 'Failed to add network error' });
  }
});

app.post('/api/logs/network', (req, res) => {
  try {
    const logData = req.body;
    addLog('networkLogs', logData);
    broadcast({ type: 'networkLog', data: logData });
    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error adding network log:', error);
    res.status(500).json({ error: 'Failed to add network log' });
  }
});

// Get all logs
app.get('/api/logs/browser', (req, res) => {
  res.json(logs.browserLogs);
});

app.get('/api/logs/console-error', (req, res) => {
  res.json(logs.consoleErrors);
});

app.get('/api/logs/network-error', (req, res) => {
  res.json(logs.networkErrors);
});

app.get('/api/logs/network', (req, res) => {
  res.json(logs.networkLogs);
});

// Clear logs
app.delete('/api/logs/browser', (req, res) => {
  logs.browserLogs = [];
  broadcast({ type: 'clearBrowserLogs' });
  res.json({ success: true });
});

app.delete('/api/logs/console-error', (req, res) => {
  logs.consoleErrors = [];
  broadcast({ type: 'clearConsoleErrors' });
  res.json({ success: true });
});

app.delete('/api/logs/network-error', (req, res) => {
  logs.networkErrors = [];
  broadcast({ type: 'clearNetworkErrors' });
  res.json({ success: true });
});

app.delete('/api/logs/network', (req, res) => {
  logs.networkLogs = [];
  broadcast({ type: 'clearNetworkLogs' });
  res.json({ success: true });
});

app.delete('/api/logs', (req, res) => {
  logs.browserLogs = [];
  logs.consoleErrors = [];
  logs.networkErrors = [];
  logs.networkLogs = [];
  broadcast({ type: 'clearAll' });
  res.json({ success: true });
});

// Generate demo data
function generateDemoData() {
  // Browser logs
  addLog('browserLogs', {
    message: 'Page loaded',
    level: 'info',
    source: 'navigator',
    timestamp: new Date().toISOString()
  });
  
  // Console errors
  addLog('consoleErrors', {
    message: 'Uncaught TypeError: Cannot read property "length" of undefined',
    stackTrace: 'at processData (app.js:42)\nat handleClick (app.js:87)',
    source: 'main.js:42',
    timestamp: new Date().toISOString()
  });
  
  // Network errors
  addLog('networkErrors', {
    url: 'https://api.example.com/data',
    status: 404,
    statusText: 'Not Found',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
  
  // Network logs
  addLog('networkLogs', {
    url: 'https://api.example.com/users',
    method: 'GET',
    status: 200,
    responseSize: 1240,
    duration: 120,
    timestamp: new Date().toISOString()
  });
}

// Start the server
server.listen(PORT, () => {
  logger.info(`Browser Tools service running on port ${PORT}`);
  console.log(`Browser Tools service running on port ${PORT}`);
  
  // Generate demo data
  generateDemoData();
  
  // Note: This service is designed to be connected to from external applications
  // through the cursor-devdock-sdk, not via internal service registration.
  // See sdk/lib/services/browser-tools-connector.ts for integration details.
}); 