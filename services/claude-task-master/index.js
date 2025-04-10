const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8002;
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';
const API_KEYS_SERVICE_URL = process.env.API_KEYS_SERVICE_URL || 'http://api-keys-service:8010';

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

// Helper function to verify API key with API Keys Service
async function verifyApiKey(service, key) {
  try {
    const response = await axios.post(`${API_KEYS_SERVICE_URL}/api/keys/verify`, {
      service,
      key
    });
    return { valid: true, ...response.data };
  } catch (error) {
    console.error('Error verifying API key:', error.message);
    return { 
      valid: false, 
      error: error.response?.data?.error || 'Failed to verify API key' 
    };
  }
}

// Helper function to store API key securely
async function storeApiKey(name, service, key) {
  try {
    // Get the admin API key from environment or use a default for development
    const adminKey = process.env.ADMIN_API_KEY || 'development_admin_key';
    
    // First check if a key with this name already exists
    const response = await axios.get(
      `${API_KEYS_SERVICE_URL}/api/keys/service/${service}/key/${name}`,
      {
        headers: {
          'x-admin-api-key': adminKey
        }
      }
    );
    
    // If key exists, return its ID
    if (response.data && response.data.id) {
      return { id: response.data.id, created: false };
    }
  } catch (error) {
    // Key doesn't exist, create a new one
    try {
      const createResponse = await axios.post(
        `${API_KEYS_SERVICE_URL}/api/keys`,
        {
          name,
          service,
          key
        },
        {
          headers: {
            'x-admin-api-key': adminKey
          }
        }
      );
      
      if (createResponse.data && createResponse.data.apiKey) {
        return { 
          id: createResponse.data.apiKey.id, 
          created: true 
        };
      }
    } catch (createError) {
      console.error('Error storing API key:', createError.message);
    }
  }
  
  return { id: null, created: false };
}

// Function to initialize the task master
async function initializeTaskMaster() {
  console.log('Initializing Claude Task Master...');
  
  try {
    // Register the service with MCP
    await axios.post(`${MCP_REST_API_URL}/api/services/register`, {
      name: 'Claude Task Master',
      url: `http://claude-task-master:${PORT}`,
      description: 'AI-powered task-management system to break down complex projects into manageable tasks',
      status: 'available',
      type: 'service'
    });
    console.log('Registered Claude Task Master with MCP REST API');
  } catch (error) {
    console.error('Error registering service:', error.message);
  }
}

// Initialize the service on startup
initializeTaskMaster();

// Task validation functions
function validateDependencies(taskId) {
  if (!tasks.has(taskId)) return { valid: false, error: 'Task not found' };
  
  const task = tasks.get(taskId);
  if (!task.dependencies || task.dependencies.length === 0) {
    return { valid: true };
  }
  
  // Check if all dependencies exist
  const invalidDeps = task.dependencies.filter(depId => !tasks.has(depId));
  if (invalidDeps.length > 0) {
    return { 
      valid: false, 
      error: `Dependencies not found: ${invalidDeps.join(', ')}` 
    };
  }
  
  // Check for circular dependencies
  const visited = new Set();
  const recStack = new Set();
  
  function hasCycle(currentId) {
    if (!tasks.has(currentId)) return false;
    
    if (recStack.has(currentId)) return true;
    if (visited.has(currentId)) return false;
    
    visited.add(currentId);
    recStack.add(currentId);
    
    const currentTask = tasks.get(currentId);
    if (currentTask.dependencies) {
      for (const depId of currentTask.dependencies) {
        if (hasCycle(depId)) return true;
      }
    }
    
    recStack.delete(currentId);
    return false;
  }
  
  if (hasCycle(taskId)) {
    return { valid: false, error: 'Circular dependency detected' };
  }
  
  return { valid: true };
}

// API to handle task submissions
app.post('/api/tasks', async (req, res) => {
  const { title, prompt, context, model, priority, apiKeyId } = req.body;
  
  // Validate required fields
  if (!title || !prompt) {
    return res.status(400).json({ error: 'Title and prompt are required' });
  }
  
  // Validate API key if provided
  if (apiKeyId) {
    try {
      const apiKey = await getApiKeyById(apiKeyId);
      if (!apiKey) {
        return res.status(400).json({ error: 'Invalid API key ID' });
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      return res.status(500).json({ error: 'Failed to validate API key' });
    }
  } else {
    return res.status(400).json({ error: 'API key ID is required' });
  }
  
  // Create a new task
  const taskId = String(taskIdCounter++);
  const now = new Date().toISOString();
  
  const newTask = {
    id: taskId,
    title,
    prompt,
    context: context || '',
    model: model || 'claude-3-opus-20240229',
    priority: priority || 'normal',
    status: 'pending',
    createdAt: now,
    apiKeyId, // Store the API key ID with the task
    subtasks: [],
    dependencies: [],
  };
  
  tasks.set(taskId, newTask);
  
  // Start processing the task
  setTimeout(() => simulateTaskProcessing(taskId), 1000);
  
  res.status(201).json(newTask);
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

// Get API key by ID from the API Keys Service
async function getApiKeyById(id) {
  try {
    // Get the admin API key from environment or use a default for development
    const adminKey = process.env.ADMIN_API_KEY || 'development_admin_key';
    
    const response = await axios.get(
      `${API_KEYS_SERVICE_URL}/api/keys/${id}`,
      {
        headers: {
          'x-admin-api-key': adminKey
        }
      }
    );
    
    if (response.data && response.data.key) {
      return response.data.key;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving API key:', error.message);
    return null;
  }
}

// Simulate task processing with actual API keys
async function simulateTaskProcessing(taskId) {
  if (!tasks.has(taskId)) return;
  
  const task = tasks.get(taskId);
  task.status = 'in_progress';
  task.startedAt = task.startedAt || new Date().toISOString();
  tasks.set(taskId, task);
  
  // Determine processing time based on priority
  let processingTime;
  switch (task.priority) {
    case 'urgent':
      processingTime = Math.floor(Math.random() * 5000) + 2000; // 2-7 seconds
      break;
    case 'high':
      processingTime = Math.floor(Math.random() * 8000) + 5000; // 5-13 seconds
      break;
    default:
      processingTime = Math.floor(Math.random() * 10000) + 10000; // 10-20 seconds
      break;
  }
  
  // In a real implementation, this would call the actual Claude API
  // using the stored API key associated with the task
  setTimeout(async () => {
    if (!tasks.has(taskId)) return;
    
    const completedTask = tasks.get(taskId);
    
    let aiResponse = "I've analyzed your request and here are my recommendations...";
    
    // If we have an API key ID, try to retrieve the real key and use it
    if (completedTask.apiKeyId) {
      try {
        const apiKey = await getApiKeyById(completedTask.apiKeyId);
        
        if (apiKey) {
          // Here you would use the actual Anthropic API with the key
          // For now, we'll just simulate a more detailed response
          aiResponse = `Based on your prompt: "${completedTask.prompt.substring(0, 30)}...", 
          I've analyzed the requirements carefully. Here are my findings and recommendations:
          
          1. First, consider the core issue at hand: ${completedTask.prompt.substring(0, 20)}...
          2. The key factors to address are related to ${completedTask.context.substring(0, 15) || 'the context provided'}...
          3. A recommended approach would be to implement a solution that addresses both immediate needs and long-term scalability.
          
          [This is a simulated response using API key ID: ${completedTask.apiKeyId}]`;
        }
      } catch (error) {
        console.error('Error processing task with API key:', error);
        // Fall back to simulated response if API fails
      }
    } else {
      // Generate a basic simulated AI response
      const responses = [
        "Based on my analysis, I recommend the following approach...",
        "I've reviewed your request and found these potential solutions...",
        "After careful consideration, here are my findings and recommendations...",
        "There are several ways to address this issue. The most efficient would be...",
        "I've analyzed your requirements and suggest the following implementation strategy..."
      ];
      
      aiResponse = responses[Math.floor(Math.random() * responses.length)] + " [Simulated AI response]";
    }
    
    completedTask.status = 'completed';
    completedTask.completedAt = new Date().toISOString();
    completedTask.response = aiResponse;
    
    tasks.set(taskId, completedTask);
  }, processingTime);
}

// Validate task dependencies
app.get('/api/validate-dependencies', (req, res) => {
  try {
    const results = [];
    
    // Check each task
    for (const [taskId, task] of tasks.entries()) {
      const validation = validateDependencies(taskId);
      
      if (!validation.valid) {
        results.push({
          taskId,
          title: task.title,
          valid: false,
          error: validation.error
        });
      }
    }
    
    if (results.length === 0) {
      return res.json({ 
        valid: true, 
        message: 'All task dependencies are valid' 
      });
    }
    
    res.json({
      valid: false,
      invalidTasks: results
    });
  } catch (error) {
    console.error('Error validating dependencies:', error);
    res.status(500).json({ error: 'Failed to validate dependencies' });
  }
});

// Fix invalid dependencies
app.post('/api/fix-dependencies', (req, res) => {
  try {
    const fixedTasks = [];
    
    // Check each task
    for (const [taskId, task] of tasks.entries()) {
      if (!task.dependencies || task.dependencies.length === 0) continue;
      
      // Filter out non-existent dependencies
      const validDeps = task.dependencies.filter(depId => tasks.has(depId));
      if (validDeps.length !== task.dependencies.length) {
        task.dependencies = validDeps;
        tasks.set(taskId, task);
        fixedTasks.push({
          taskId,
          title: task.title,
          action: 'Removed invalid dependencies'
        });
      }
    }
    
    // Check for circular dependencies
    const visited = new Set();
    
    function detectAndBreakCycles() {
      for (const [taskId, task] of tasks.entries()) {
        if (visited.has(taskId)) continue;
        
        const path = [];
        const recStack = new Set();
        
        function dfs(currentId) {
          if (!tasks.has(currentId)) return false;
          
          if (recStack.has(currentId)) {
            // Found a cycle
            const cycleStart = path.indexOf(currentId);
            const cycle = path.slice(cycleStart).concat(currentId);
            
            // Break the cycle by removing the last dependency
            const lastTaskId = cycle[cycle.length - 2];
            const lastTask = tasks.get(lastTaskId);
            
            if (lastTask && lastTask.dependencies) {
              const cycleIndex = lastTask.dependencies.indexOf(currentId);
              if (cycleIndex !== -1) {
                lastTask.dependencies.splice(cycleIndex, 1);
                tasks.set(lastTaskId, lastTask);
                fixedTasks.push({
                  taskId: lastTaskId,
                  title: lastTask.title,
                  action: `Removed dependency on task ${currentId} to break cycle`
                });
              }
            }
            
            return true;
          }
          
          if (visited.has(currentId)) return false;
          
          visited.add(currentId);
          recStack.add(currentId);
          path.push(currentId);
          
          const currentTask = tasks.get(currentId);
          if (currentTask.dependencies) {
            for (const depId of currentTask.dependencies) {
              if (dfs(depId)) return true;
            }
          }
          
          path.pop();
          recStack.delete(currentId);
          return false;
        }
        
        dfs(taskId);
      }
    }
    
    detectAndBreakCycles();
    
    if (fixedTasks.length === 0) {
      return res.json({ 
        fixed: false, 
        message: 'No dependency issues found' 
      });
    }
    
    res.json({
      fixed: true,
      fixedTasks
    });
  } catch (error) {
    console.error('Error fixing dependencies:', error);
    res.status(500).json({ error: 'Failed to fix dependencies' });
  }
});

// Get complexity report endpoint
app.get('/api/complexity-report', (req, res) => {
  try {
    const { threshold = 5 } = req.query;
    const thresholdVal = parseInt(threshold) || 5;
    
    // Analyze all tasks
    const allTasks = Array.from(tasks.values());
    
    // Group tasks by complexity
    const complexityGroups = {
      high: [], // 8-10
      medium: [], // 5-7
      low: []  // 1-4
    };
    
    const results = allTasks.map(task => {
      const textLength = (task.prompt || '').length + (task.context || '').length;
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      const dependencyCount = (task.dependencies || []).length;
      
      // Calculate complexity
      let complexity = Math.min(10, Math.max(1, Math.round(textLength / 200 + dependencyCount + (hasSubtasks ? 2 : 0))));
      const recommendedSubtasks = Math.max(2, Math.min(10, Math.round(complexity * 0.7)));
      
      const result = {
        taskId: task.id,
        title: task.title,
        complexity,
        needsBreakdown: complexity > thresholdVal,
        recommendedSubtasks,
        hasExistingSubtasks: hasSubtasks,
        expansionCommand: `task-master expand --id=${task.id} --num=${recommendedSubtasks}`
      };
      
      // Assign to complexity group
      if (complexity >= 8) {
        complexityGroups.high.push(result);
      } else if (complexity >= 5) {
        complexityGroups.medium.push(result);
      } else {
        complexityGroups.low.push(result);
      }
      
      return result;
    });
    
    // Sort within each group
    ['high', 'medium', 'low'].forEach(group => {
      complexityGroups[group].sort((a, b) => b.complexity - a.complexity);
    });
    
    const tasksNeedingBreakdown = results.filter(item => item.needsBreakdown);
    
    res.json({
      complexityDistribution: {
        high: complexityGroups.high.length,
        medium: complexityGroups.medium.length,
        low: complexityGroups.low.length
      },
      highComplexityTasks: complexityGroups.high,
      mediumComplexityTasks: complexityGroups.medium,
      lowComplexityTasks: complexityGroups.low,
      summary: {
        totalTasks: results.length,
        averageComplexity: results.length > 0 ? 
          results.reduce((sum, item) => sum + item.complexity, 0) / results.length : 0,
        tasksNeedingBreakdown: tasksNeedingBreakdown.length,
        recommendedActions: tasksNeedingBreakdown.map(task => task.expansionCommand)
      }
    });
  } catch (error) {
    console.error('Error generating complexity report:', error);
    res.status(500).json({ error: 'Failed to generate complexity report' });
  }
});

// Research-backed task generation
app.post('/api/research-task', async (req, res) => {
  try {
    const { prompt, context, model = 'claude-3-opus-20240229' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // In a real implementation, this would call an external research API
    // For now, we'll simulate research-backed task generation
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create a new task with research context
    const taskId = String(taskIdCounter++);
    const now = new Date().toISOString();
    
    const newTask = {
      id: taskId,
      title: `Research: ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      prompt,
      context: context || 'Generated through research-backed task creation',
      model,
      priority: 'normal',
      status: 'pending',
      createdAt: now,
      researchBacked: true,
      subtasks: [],
      dependencies: [],
    };
    
    tasks.set(taskId, newTask);
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating research-backed task:', error);
    res.status(500).json({ error: 'Failed to create research-backed task' });
  }
});

// Import tasks from JSON
app.post('/api/tasks/import', (req, res) => {
  try {
    const { tasks: tasksToImport } = req.body;
    
    if (!Array.isArray(tasksToImport)) {
      return res.status(400).json({ error: 'Invalid tasks format. Expected an array.' });
    }
    
    let importedCount = 0;
    let highestId = 0;
    
    // Process each task
    tasksToImport.forEach(task => {
      // Validate required fields
      if (!task.id || !task.title || !task.prompt) {
        return;
      }
      
      // Update task counter if needed
      const numericId = parseInt(task.id);
      if (!isNaN(numericId) && numericId > highestId) {
        highestId = numericId;
      }
      
      // Import task
      tasks.set(task.id, {
        ...task,
        // Ensure required fields exist
        status: task.status || 'pending',
        createdAt: task.createdAt || new Date().toISOString(),
        dependencies: task.dependencies || [],
        subtasks: task.subtasks || []
      });
      
      importedCount++;
    });
    
    // Update task counter
    taskIdCounter = highestId + 1;
    
    res.json({
      success: true,
      imported: importedCount,
      message: `Successfully imported ${importedCount} tasks`
    });
  } catch (error) {
    console.error('Error importing tasks:', error);
    res.status(500).json({ error: 'Failed to import tasks' });
  }
});

// Export tasks to JSON
app.get('/api/tasks/export', (req, res) => {
  try {
    const allTasks = Array.from(tasks.values());
    
    res.json({
      tasks: allTasks,
      metadata: {
        exportedAt: new Date().toISOString(),
        count: allTasks.length
      }
    });
  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ error: 'Failed to export tasks' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Claude Task Master service running on port ${PORT}`);
  console.log(`Registered with MCP REST API at ${MCP_REST_API_URL}`);
}); 