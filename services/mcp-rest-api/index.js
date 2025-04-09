const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8001;
const MCP_KONNECT_URL = process.env.MCP_KONNECT_URL || 'http://mcp-konnect:8000';

app.use(cors());
app.use(bodyParser.json());

// Register a new API with MCP Konnect
app.post('/register-api', async (req, res) => {
  try {
    const { name, url, description } = req.body;
    
    const response = await axios.post(`${MCP_KONNECT_URL}/apis`, {
      name,
      url,
      description
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error registering API:', error);
    res.status(500).json({ error: 'Failed to register API' });
  }
});

// Route a task to the appropriate service
app.post('/route-task', async (req, res) => {
  try {
    const { task, context } = req.body;
    
    // In a real implementation, you'd have logic to determine which service to route to
    // based on the task content or metadata
    
    // For now, we'll just simulate a response
    res.json({
      task_id: Math.random()
    });
  } catch (error) {
    console.error('Error routing task:', error);
    res.status(500).json({ error: 'Failed to route task' });
  }
});

app.listen(PORT, () => {
  console.log(`MCP REST API running on port ${PORT}`);
}); 