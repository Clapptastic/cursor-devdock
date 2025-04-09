const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8002;
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';

app.use(cors());
app.use(bodyParser.json());

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create index.html if it doesn't exist
const indexPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Task Master</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      color: #4f46e5;
    }
    .info {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <h1>Claude Task Master Service</h1>
  <div class="info">
    <p>This service is running correctly. Access the Task Master through the main DevDock Dashboard.</p>
    <p><a href="http://localhost:10000">Go to DevDock Dashboard</a></p>
  </div>
</body>
</html>`;
  fs.writeFileSync(indexPath, indexHtml);
}

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
      dependencies: [],
      subtasks: [
        {
          id: "1.1",
          title: "Identify key metrics in payload",
          status: "completed",
          description: "Review the payload to identify the primary metrics and KPIs that would be valuable for the dashboard."
        },
        {
          id: "1.2",
          title: "Document payload structure",
          status: "completed",
          description: "Create a structured documentation of the payload format, including data types and field descriptions."
        },
        {
          id: "1.3",
          title: "Recommend visualization approaches",
          status: "completed",
          description: "Suggest appropriate visualization types for each key metric identified in the payload."
        }
      ],
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
      completedAt: null,
      dependencies: [],
      subtasks: []
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
      completedAt: null,
      dependencies: ["1", "2"],
      subtasks: []
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
    const { title, prompt, context, priority, model, dependencies } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Task prompt is required' });
    }
    
    // Create a new task record
    const taskId = String(taskIdCounter++);
    const newTask = {
      id: taskId,
      title: title || (prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '')),
      prompt,
      context: context || '',
      model: model || 'claude-3-opus-20240229',
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      dependencies: dependencies || [],
      subtasks: []
    };
    
    // Store the task
    tasks.set(taskId, newTask);
    
    // Route task to MCP REST API
    try {
      const response = await axios.post(`${MCP_REST_API_URL}/route-task`, {
        task: prompt,
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
    
    if (!status || !['pending', 'processing', 'in_progress', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const task = tasks.get(taskId);
    task.status = status;
    
    if (['processing', 'in_progress'].includes(status) && !task.startedAt) {
      task.startedAt = new Date().toISOString();
    }
    
    if (['completed', 'failed'].includes(status) && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    
    // If task is completed, also mark all subtasks as completed
    if (status === 'completed' && task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => {
        subtask.status = 'completed';
      });
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

// Update task priority
app.put('/api/tasks/:id/priority', (req, res) => {
  try {
    const taskId = req.params.id;
    const { priority } = req.body;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (!priority || !['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    const task = tasks.get(taskId);
    task.priority = priority;
    tasks.set(taskId, task);
    
    res.json(task);
  } catch (error) {
    console.error(`Error updating task priority ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update task priority' });
  }
});

// Generate subtasks for a task
app.post('/api/tasks/:id/subtasks', (req, res) => {
  try {
    const taskId = req.params.id;
    const { num = 3, context = '' } = req.body;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks.get(taskId);
    const subtasksCount = parseInt(num, 10);
    
    if (isNaN(subtasksCount) || subtasksCount < 1 || subtasksCount > 10) {
      return res.status(400).json({ error: 'Number of subtasks must be between 1 and 10' });
    }
    
    // Generate subtasks for the task (simulated AI generation)
    const subtasks = [];
    for (let i = 1; i <= subtasksCount; i++) {
      const subtaskId = `${taskId}.${i}`;
      subtasks.push({
        id: subtaskId,
        title: `Subtask ${i} for ${task.title}`,
        status: 'pending',
        description: `AI-generated subtask ${i} for task "${task.title}". ${context ? `Context: ${context}` : ''}`
      });
    }
    
    task.subtasks = subtasks;
    tasks.set(taskId, task);
    
    res.json(task);
  } catch (error) {
    console.error(`Error generating subtasks for task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to generate subtasks' });
  }
});

// Clear subtasks for a task
app.delete('/api/tasks/:id/subtasks', (req, res) => {
  try {
    const taskId = req.params.id;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks.get(taskId);
    task.subtasks = [];
    tasks.set(taskId, task);
    
    res.json(task);
  } catch (error) {
    console.error(`Error clearing subtasks for task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to clear subtasks' });
  }
});

// Add task dependency
app.post('/api/tasks/:id/dependencies', (req, res) => {
  try {
    const taskId = req.params.id;
    const { dependsOn } = req.body;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (!dependsOn || !tasks.has(dependsOn)) {
      return res.status(400).json({ error: 'Dependency task not found' });
    }
    
    // Prevent circular dependencies
    const dependencyTask = tasks.get(dependsOn);
    if (dependencyTask.dependencies && dependencyTask.dependencies.includes(taskId)) {
      return res.status(400).json({ error: 'Adding this dependency would create a circular reference' });
    }
    
    const task = tasks.get(taskId);
    
    // Check if dependency already exists
    if (!task.dependencies) {
      task.dependencies = [];
    }
    
    if (!task.dependencies.includes(dependsOn)) {
      task.dependencies.push(dependsOn);
    }
    
    tasks.set(taskId, task);
    
    res.json(task);
  } catch (error) {
    console.error(`Error adding dependency for task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to add dependency' });
  }
});

// Remove task dependency
app.delete('/api/tasks/:id/dependencies/:dependencyId', (req, res) => {
  try {
    const taskId = req.params.id;
    const dependencyId = req.params.dependencyId;
    
    if (!tasks.has(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks.get(taskId);
    
    if (!task.dependencies) {
      task.dependencies = [];
    }
    
    task.dependencies = task.dependencies.filter(id => id !== dependencyId);
    tasks.set(taskId, task);
    
    res.json(task);
  } catch (error) {
    console.error(`Error removing dependency for task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to remove dependency' });
  }
});

// Analyze task complexity
app.post('/api/analyze-complexity', (req, res) => {
  try {
    const { taskIds = [], threshold = 5 } = req.body;
    
    let tasksToAnalyze = [];
    
    if (taskIds.length > 0) {
      // Filter valid task IDs
      tasksToAnalyze = taskIds
        .filter(id => tasks.has(id))
        .map(id => tasks.get(id));
    } else {
      // Analyze all tasks
      tasksToAnalyze = Array.from(tasks.values());
    }
    
    // Simulate complexity analysis
    const results = tasksToAnalyze.map(task => {
      const textLength = (task.prompt || '').length + (task.context || '').length;
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      const dependencyCount = (task.dependencies || []).length;
      
      // Simple algorithm to calculate complexity (in a real app, this would use AI)
      let complexity = Math.min(10, Math.max(1, Math.round(textLength / 200 + dependencyCount + (hasSubtasks ? 2 : 0))));
      const recommendedSubtasks = Math.max(2, Math.min(10, Math.round(complexity * 0.7)));
      
      return {
        taskId: task.id,
        title: task.title,
        complexity,
        needsBreakdown: complexity > threshold,
        recommendedSubtasks,
        hasExistingSubtasks: hasSubtasks,
        expansionCommand: `task-master expand --id=${task.id} --num=${recommendedSubtasks}`
      };
    });
    
    // Sort by complexity (highest first)
    results.sort((a, b) => b.complexity - a.complexity);
    
    res.json({
      results,
      summary: {
        averageComplexity: results.reduce((sum, item) => sum + item.complexity, 0) / results.length,
        tasksNeedingBreakdown: results.filter(item => item.needsBreakdown).length
      }
    });
  } catch (error) {
    console.error('Error analyzing complexity:', error);
    res.status(500).json({ error: 'Failed to analyze task complexity' });
  }
});

// Get next task to work on
app.get('/api/next-task', (req, res) => {
  try {
    const allTasks = Array.from(tasks.values());
    
    // Filter tasks that are pending or in progress
    const availableTasks = allTasks.filter(task => 
      ['pending', 'processing', 'in_progress'].includes(task.status)
    );
    
    if (availableTasks.length === 0) {
      return res.json({ message: 'No pending tasks available' });
    }
    
    // Check which tasks have all dependencies satisfied
    const tasksWithSatisfiedDependencies = availableTasks.filter(task => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      
      return task.dependencies.every(depId => {
        const dependencyTask = tasks.get(depId);
        return dependencyTask && dependencyTask.status === 'completed';
      });
    });
    
    if (tasksWithSatisfiedDependencies.length === 0) {
      return res.json({ 
        message: 'All pending tasks have unmet dependencies',
        pendingDependencies: availableTasks.map(task => ({
          taskId: task.id,
          title: task.title,
          dependencies: (task.dependencies || []).map(depId => ({
            id: depId,
            title: tasks.get(depId)?.title || 'Unknown task',
            status: tasks.get(depId)?.status || 'unknown'
          }))
        }))
      });
    }
    
    // Sort by priority and then by ID
    const priorityOrder = { 'urgent': 0, 'high': 1, 'normal': 2, 'low': 3 };
    
    tasksWithSatisfiedDependencies.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by ID (assuming numerical IDs)
      return parseInt(a.id) - parseInt(b.id);
    });
    
    // Return the highest priority task with satisfied dependencies
    const nextTask = tasksWithSatisfiedDependencies[0];
    
    // Get suggested actions
    const suggestedActions = [
      `task-master set-status --id=${nextTask.id} --status=in_progress`,
      `task-master set-status --id=${nextTask.id} --status=completed`
    ];
    
    if (!nextTask.subtasks || nextTask.subtasks.length === 0) {
      suggestedActions.push(`task-master expand --id=${nextTask.id} --num=3`);
    }
    
    res.json({
      nextTask,
      suggestedActions
    });
  } catch (error) {
    console.error('Error getting next task:', error);
    res.status(500).json({ error: 'Failed to determine next task' });
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
    if (!tasks.has(taskId)) return;
    
    const completedTask = tasks.get(taskId);
    
    // Generate a simulated AI response
    const responses = [
      "Based on my analysis, I recommend the following approach...",
      "I've reviewed your request and found these potential solutions...",
      "After careful consideration, here are my findings and recommendations...",
      "There are several ways to address this issue. The most efficient would be...",
      "I've analyzed your requirements and suggest the following implementation strategy..."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    completedTask.status = 'completed';
    completedTask.completedAt = new Date().toISOString();
    completedTask.response = randomResponse + " [Simulated AI response]";
    
    tasks.set(taskId, completedTask);
  }, processingTime);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Claude Task Master service running on port ${PORT}`);
  console.log(`Registered with MCP REST API at ${MCP_REST_API_URL}`);
}); 