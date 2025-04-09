const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 8004;
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';

app.use(cors());
app.use(bodyParser.json());

// Store logs in memory (in a real app, use a database)
const browserLogs = [];

// REST API for browser logs
app.post('/api/logs', (req, res) => {
  const { url, event, details } = req.body;
  
  if (!url || !event) {
    return res.status(400).json({ error: 'URL and event are required' });
  }
  
  const log = {
    timestamp: new Date().toISOString(),
    url,
    event,
    details: details || {},
  };
  
  browserLogs.push(log);
  
  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(log));
    }
  });
}); 