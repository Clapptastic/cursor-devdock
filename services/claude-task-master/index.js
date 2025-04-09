const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8002;
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';

app.use(cors());
app.use(bodyParser.json());

// Serve static files for the UI
app.use(express.static('public'));

// API to handle task submissions
app.post('/api/tasks', async (req, res) => {
  try {
    const { task, context } = req.body;
    
    // Route task to appropriate service via MCP
    const response = await axios.post(`${MCP_REST_API_URL}/route-task`, {
      task,
      context
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error routing task:', error);
    res.status(500).json({ error: 'Failed to process task' });
  }
});

// Get task history
app.get('/api/tasks', (req, res) => {
  // In a real implementation, this would fetch from a database
  res.json([
    { id: 1, task: 'Analyze API payload', status: 'completed' },
    { id: 2, task: 'Debug authentication flow', status: 'in_progress' }
  ]);
});

app.listen(PORT, () => {
  console.log(`Claude Task Master running on port ${PORT}`);
}); 