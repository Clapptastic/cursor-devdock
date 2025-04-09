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

// In-memory storage for tasks (in a real app, this would be a database)
const tasks = new Map();
let taskIdCounter = 1;

// Generate some initial demo tasks
function generateDemoTasks() {
  const demoTasks = [
    {
      id: String(taskIdCounter++),
      title: "Analyze API payload structure",
      prompt: "I need to understand the structure of the JSON payload being returned from our user analytics API endpoint. Can you analyze it and help me identify the key fields I should focus on?",
      context: "The API endpoint is /api/user-analytics and I'm trying to build a dashboard.",
      model: "claude-3-sonnet-20240229",
      priority: "normal",
      status: "completed",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      startedAt: new Date(Date.now() - 86340000).toISOString(),
      completedAt: new Date(Date.now() - 86300000).toISOString(),
      response: "Based on the API payload structure, I recommend focusing on these key fields:\n\n1. `userCount` - Total number of active users\n2. `sessionDuration` - Average time users spend on your platform\n3. `conversionRate` - Percentage of users completing desired actions\n4. `bounceRate` - Percentage of users leaving after viewing only one page\n5. `topDevices` - Breakdown of user device categories\n\nThese fields will give you the most valuable insights for your dashboard."
    },
    {
      id: String(taskIdCounter++),
      title: "Debug authentication flow",
      prompt: "I'm having issues with our OAuth implementation. Users are sometimes getting stuck in a redirect loop. Can you help me identify potential causes and solutions?",
      context: "We're using Auth0 for authentication, and the issue happens on mobile devices more frequently.",
      model: "claude-3-opus-20240229",
      priority: "high",
      status: "in_progress",
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      startedAt: new Date(Date.now() - 3540000).toISOString(),
      completedAt: null
    },
    {
      id: String(taskIdCounter++),
      title: "Improve SQL query performance",
      prompt: "I have a complex SQL query that's taking too long to execute. Can you review it and suggest optimizations?",
      context: "SELECT o.order_id, c.customer_name, SUM(oi.quantity * p.price) as total_amount FROM orders o JOIN customers c ON o.customer_id = c.customer_id JOIN order_items oi ON o.order_id = oi.order_id JOIN products p ON oi.product_id = p.product_id WHERE o.order_date BETWEEN '2023-01-01' AND '2023-12-31' GROUP BY o.order_id, c.customer_name ORDER BY total_amount DESC;",
      model: "claude-3-haiku-20240307",
      priority: "urgent",
      status: "pending",
      createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      startedAt: null,
      completedAt: null
    }
  ];

  // Store demo tasks in our in-memory storage
  demoTasks.forEach(task => {
    tasks.set(task.id, task);
  });
}

// Generate demo tasks on startup
generateDemoTasks();

// API to handle task submissions
app.post('/api/tasks', async (req, res) => {
  try {
    const { task, context, priority, model } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task description is required' });
    }
    
    // Create a new task record
    const taskId = String(taskIdCounter++);
    const newTask = {
      id: taskId,
      title: task.substring(0, 50) + (task.length > 50 ? '...' : ''),
      prompt: task,
      context: context || '',
      model: model || 'claude-3-opus-20240229',
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };
    
    // Store the task
    tasks.set(taskId, newTask);
    
    // Route task to MCP REST API
    try {
      const response = await axios.post(`${MCP_REST_API_URL}/route-task`, {
        task,
        context,
        model,
        priority
      });
      
      // Update task with response data
      const updatedTask = tasks.get(taskId);
      updatedTask.status = 'processing';
      updatedTask.startedAt = new Date().toISOString();
      tasks.set(taskId, updatedTask);
      
      // Start processing the task (simulated)
      setTimeout(() => simulateTaskProcessing(taskId), 5000);
      
      res.status(201).json({
        taskId,
        status: 'pending',
        ...response.data
      });
    } catch (error) {
      console.error('Error routing task to MCP:', error);
      // Still return success as we have stored the task locally
      res.status(201).json({
        taskId,
        status: 'pending',
        message: 'Task submitted successfully but could not route to MCP. Will retry.'
      });
      
      // Retry routing (in a real app, this would be handled by a queue)
      setTimeout(() => {
        simulateTaskProcessing(taskId);
      }, 5000);
    }
  } catch (error) {
    console.error('Error handling task submission:', error);
    res.status(500).json({ error: 'Failed to process task' });
  }
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const allTasks = Array.from(tasks.values());
    
    // Sort by created date (newest first)
    allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(allTasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// Get task by ID
app.get('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(tasks.get(taskId));
  } catch (error) {
    console.error(`Error getting task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve task' });
  }
});

// Update task status
app.put('/api/tasks/:id/status', (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const task = tasks.get(taskId);
    task.status = status;
    
    if (status === 'processing' && !task.startedAt) {
      task.startedAt = new Date().toISOString();
    }
    
    if (['completed', 'failed'].includes(status) && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    
    tasks.set(taskId, task);
    
    res.json(task);
  } catch (error) {
    console.error(`Error updating task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks.delete(taskId);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', version: '1.0.0' });
});

// Simulate task processing (would be handled by actual AI in production)
function simulateTaskProcessing(taskId) {
  if (!tasks.has(taskId)) return;
  
  const task = tasks.get(taskId);
  
  // Already completed or failed
  if (['completed', 'failed'].includes(task.status)) return;
  
  // Update to processing if still pending
  if (task.status === 'pending') {
    task.status = 'processing';
    task.startedAt = new Date().toISOString();
    tasks.set(taskId, task);
  }
  
  // Simulate processing time (1-10 seconds based on priority)
  const processingTime = task.priority === 'urgent' ? 1000 : 
                        task.priority === 'high' ? 3000 : 
                        10000;
  
  setTimeout(() => {
    // 90% success rate
    if (Math.random() < 0.9) {
      // Generate a simulated response based on the task
      let response = '';
      
      if (task.prompt.toLowerCase().includes('analyze') || task.prompt.toLowerCase().includes('review')) {
        response = `I've analyzed the information you provided. Here are my key findings:\n\n`;
        response += `1. The structure appears to be well-organized but could be optimized further.\n`;
        response += `2. There are several opportunities for improvement in efficiency.\n`;
        response += `3. The approach you're taking is sound, but consider these alternatives...\n\n`;
        response += `Let me know if you'd like me to elaborate on any of these points.`;
      } else if (task.prompt.toLowerCase().includes('debug') || task.prompt.toLowerCase().includes('fix')) {
        response = `After examining the issue, I've identified these potential causes:\n\n`;
        response += `1. The authentication timeout might be too short for mobile connections.\n`;
        response += `2. There could be a cache invalidation issue after token refresh.\n`;
        response += `3. The redirect URI might not be properly configured for all environments.\n\n`;
        response += `I recommend increasing the timeout setting and verifying that the redirect URIs match exactly across all configurations.`;
      } else {
        response = `Based on your request, I've completed the task. Here's what I found:\n\n`;
        response += `The approach seems solid overall. I'd suggest a couple of refinements:\n`;
        response += `- Consider optimizing the workflow for better efficiency\n`;
        response += `- The current implementation works well, but could be enhanced with additional validation\n\n`;
        response += `I'm available if you need any clarification or have follow-up questions.`;
      }
      
      task.status = 'completed';
      task.response = response;
    } else {
      task.status = 'failed';
      task.response = "I encountered an error while processing this task. This could be due to complexity, insufficient context, or resource constraints. Please try again with more details or contact support if the issue persists.";
    }
    
    task.completedAt = new Date().toISOString();
    tasks.set(taskId, task);
  }, processingTime);
}

app.listen(PORT, () => {
  console.log(`Claude Task Master running on port ${PORT}`);
}); 