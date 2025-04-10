const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001;
const MCP_KONNECT_URL = process.env.MCP_KONNECT_URL || 'http://mcp-konnect:3333';
const BROWSER_TOOLS_URL = process.env.BROWSER_TOOLS_URL || 'http://browser-tools:8004';

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MCP REST API',
      version: '1.0.0',
      description: 'MCP REST API Documentation for Cursor DevDock',
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
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Service ID'
            },
            name: {
              type: 'string',
              description: 'Service name'
            },
            url: {
              type: 'string',
              description: 'Service URL'
            },
            description: {
              type: 'string',
              description: 'Service description'
            },
            type: {
              type: 'string',
              description: 'Service type'
            },
            status: {
              type: 'string',
              description: 'Service status',
              enum: ['active', 'inactive']
            },
            registeredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Registration timestamp'
            }
          }
        },
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

app.use(cors());
app.use(bodyParser.json());

// In-memory service registry
const services = [];

// In-memory storage for tasks
const tasks = new Map();
let taskIdCounter = 1;

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all registered services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: A list of services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
app.get('/services', (req, res) => {
  res.json(services);
});

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Register a new service or update an existing one
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               url:
 *                 type: string
 *                 description: Service URL
 *               description:
 *                 type: string
 *                 description: Service description
 *               type:
 *                 type: string
 *                 description: Service type
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       500:
 *         description: Server error
 */
app.post('/services', (req, res) => {
  try {
    const { name, url, description, type } = req.body;
    
    // Check if service already exists
    const existingService = services.find(s => s.name === name);
    if (existingService) {
      // Update existing service
      Object.assign(existingService, { url, description, type });
      res.json(existingService);
    } else {
      // Add new service
      const newService = {
        id: services.length + 1,
        name,
        url,
        description,
        type,
        status: 'active',
        registeredAt: new Date().toISOString()
      };
      services.push(newService);
      res.status(201).json(newService);
    }
  } catch (error) {
    console.error('Error registering service:', error);
    res.status(500).json({ error: 'Failed to register service' });
  }
});

/**
 * @swagger
 * /forward-to-browser-tools:
 *   post:
 *     summary: Forward browser logs to browser-tools service
 *     tags: [Browser Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BrowserLog'
 *     responses:
 *       200:
 *         description: Log forwarded successfully
 *       500:
 *         description: Failed to forward log
 */
app.post('/forward-to-browser-tools', async (req, res) => {
  try {
    const { url, event, details } = req.body;
    
    const response = await axios.post(`${BROWSER_TOOLS_URL}/api/browser-logs`, {
      url,
      event,
      details
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding to browser-tools:', error);
    res.status(500).json({ error: 'Failed to forward to browser-tools' });
  }
});

/**
 * @swagger
 * /forward-console-error:
 *   post:
 *     summary: Forward console errors to browser-tools service
 *     tags: [Browser Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsoleError'
 *     responses:
 *       200:
 *         description: Error forwarded successfully
 *       500:
 *         description: Failed to forward error
 */
app.post('/forward-console-error', async (req, res) => {
  try {
    const { url, message, stack } = req.body;
    
    const response = await axios.post(`${BROWSER_TOOLS_URL}/api/console-errors`, {
      url,
      message,
      stack
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding console error:', error);
    res.status(500).json({ error: 'Failed to forward console error' });
  }
});

/**
 * @swagger
 * /forward-network-error:
 *   post:
 *     summary: Forward network errors to browser-tools service
 *     tags: [Browser Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NetworkError'
 *     responses:
 *       200:
 *         description: Error forwarded successfully
 *       500:
 *         description: Failed to forward error
 */
app.post('/forward-network-error', async (req, res) => {
  try {
    const { url, status, statusText, method } = req.body;
    
    const response = await axios.post(`${BROWSER_TOOLS_URL}/api/network-errors`, {
      url,
      status,
      statusText,
      method
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding network error:', error);
    res.status(500).json({ error: 'Failed to forward network error' });
  }
});

/**
 * @swagger
 * /forward-network-log:
 *   post:
 *     summary: Forward network logs to browser-tools service
 *     tags: [Browser Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NetworkLog'
 *     responses:
 *       200:
 *         description: Log forwarded successfully
 *       500:
 *         description: Failed to forward log
 */
app.post('/forward-network-log', async (req, res) => {
  try {
    const { url, method, status, duration, size } = req.body;
    
    const response = await axios.post(`${BROWSER_TOOLS_URL}/api/network-logs`, {
      url,
      method,
      status,
      duration,
      size
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding network log:', error);
    res.status(500).json({ error: 'Failed to forward network log' });
  }
});

/**
 * @swagger
 * /register-api:
 *   post:
 *     summary: Register a new API with MCP Konnect
 *     tags: [MCP Konnect]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 description: API name
 *               url:
 *                 type: string
 *                 description: API URL
 *               description:
 *                 type: string
 *                 description: API description
 *     responses:
 *       200:
 *         description: API registered successfully
 *       500:
 *         description: Failed to register API
 */
app.post('/register-api', async (req, res) => {
  try {
    const { name, url, description } = req.body;
    
    const response = await axios.post(`${MCP_KONNECT_URL}/api/services/register`, {
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

/**
 * @swagger
 * /route-task:
 *   post:
 *     summary: Route a task to the appropriate service
 *     tags: [Task Routing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *             properties:
 *               task:
 *                 type: string
 *                 description: Task content or description
 *               context:
 *                 type: object
 *                 description: Additional context for the task
 *     responses:
 *       200:
 *         description: Task routed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task_id:
 *                   type: string
 *                   description: Assigned task ID
 *       500:
 *         description: Failed to route task
 */
app.post('/route-task', async (req, res) => {
  try {
    const { task, context } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }
    
    const taskId = String(taskIdCounter++);
    const newTask = {
      id: taskId,
      title: task.substring(0, 50) + (task.length > 50 ? '...' : ''),
      prompt: task,
      context: context || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    tasks.set(taskId, newTask);
    logger.info(`Task routed: ${taskId}`);
    
    // Determine which service to route to (this would be more sophisticated in production)
    const serviceType = determineServiceType(task);
    
    // Start processing the task
    setTimeout(() => processTask(taskId), 1000);
    
    res.json({
      taskId,
      service: serviceType,
      status: 'pending'
    });
  } catch (error) {
    logger.error('Error routing task:', error);
    res.status(500).json({ error: 'Failed to route task' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: MCP REST API
 */
app.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'MCP REST API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', version: '1.0.0' });
});

// Get all tasks
app.get('/tasks', (req, res) => {
  try {
    const allTasks = Array.from(tasks.values());
    res.json(allTasks);
  } catch (error) {
    logger.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// Get task by ID
app.get('/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const task = tasks.get(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    logger.error(`Error getting task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve task' });
  }
});

// Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, prompt, model, priority } = req.body;
    
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Title and prompt are required' });
    }
    
    const taskId = String(taskIdCounter++);
    const newTask = {
      id: taskId,
      title,
      prompt,
      model: model || 'claude-3-opus-20240229',
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    tasks.set(taskId, newTask);
    logger.info(`Task created: ${taskId}`);
    
    // Start processing the task (this would normally be done asynchronously)
    setTimeout(() => processTask(taskId), 1000);
    
    res.status(201).json(newTask);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status
app.put('/tasks/:id/status', (req, res) => {
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
    logger.info(`Task ${taskId} status updated to ${status}`);
    
    res.json(task);
  } catch (error) {
    logger.error(`Error updating task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Register with MCP Konnect
async function registerWithMcpKonnect() {
  try {
    const response = await axios.post(`${MCP_KONNECT_URL}/api/services/register`, {
      name: 'MCP REST API',
      url: `http://mcp-rest-api:${PORT}`,
      description: 'REST API for MCP services',
      type: 'api'
    });
    
    logger.info('Registered with MCP Konnect:', response.data);
  } catch (error) {
    logger.error('Failed to register with MCP Konnect:', error);
    // Retry after some delay
    setTimeout(registerWithMcpKonnect, 10000);
  }
}

// Helper function to determine service type based on task content
function determineServiceType(task) {
  const taskLower = task.toLowerCase();
  
  if (taskLower.includes('scrape') || taskLower.includes('extract') || taskLower.includes('web data')) {
    return 'scraper';
  } else if (taskLower.includes('debug') || taskLower.includes('visualize')) {
    return 'debug-visualizer';
  } else if (taskLower.includes('browser') || taskLower.includes('log')) {
    return 'browser-tools';
  } else {
    return 'claude-task-master';
  }
}

// Simulate task processing (in production, this would interact with real AI services)
async function processTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return;
  
  // Update status to processing
  task.status = 'processing';
  task.startedAt = new Date().toISOString();
  tasks.set(taskId, task);
  
  // Simulate processing time based on prompt length and task complexity
  const processingTime = Math.min(1000 + task.prompt.length * 10, 15000);
  
  setTimeout(() => {
    try {
      // Simulate successful completion (90% success rate)
      if (Math.random() < 0.9) {
        const responseTemplates = [
          `Based on your request, I have analyzed "${task.title}" and found the following insights:`,
          `I've completed the task "${task.title}". Here are my findings:`,
          `After evaluating your request about "${task.title}", I've determined:`
        ];
        
        const responseDetails = [
          "The key findings suggest that this approach would be optimal for your needs.",
          "Analysis indicates a positive correlation between the variables you mentioned.",
          "I recommend proceeding with caution, but the data supports your hypothesis.",
          "The results are inconclusive, but there are promising avenues for further exploration.",
          "This represents a significant improvement over previous methods."
        ];
        
        const conclusion = [
          "Let me know if you need any clarification or have follow-up questions.",
          "I'm available to provide additional analysis if needed.",
          "I can explore this topic in more depth if you'd like more detailed information."
        ];
        
        // Generate a somewhat realistic response
        task.response = `${responseTemplates[Math.floor(Math.random() * responseTemplates.length)]}\n\n`;
        task.response += `${responseDetails[Math.floor(Math.random() * responseDetails.length)]}\n\n`;
        task.response += `${conclusion[Math.floor(Math.random() * conclusion.length)]}`;
        task.status = 'completed';
      } else {
        // Simulate failure
        task.response = "I encountered an error while processing this task. This could be due to complexity, resource constraints, or insufficient context.";
        task.status = 'failed';
      }
      
      task.completedAt = new Date().toISOString();
      tasks.set(taskId, task);
      logger.info(`Task ${taskId} processed: ${task.status}`);
    } catch (error) {
      logger.error(`Error processing task ${taskId}:`, error);
      task.status = 'failed';
      task.completedAt = new Date().toISOString();
      task.response = "An unexpected error occurred while processing this task.";
      tasks.set(taskId, task);
    }
  }, processingTime);
}

// Start the server
app.listen(PORT, () => {
  logger.info(`MCP REST API running on port ${PORT}`);
  console.log(`MCP REST API running on port ${PORT}`);
  
  // Register with MCP Konnect after server starts
  setTimeout(registerWithMcpKonnect, 5000);
}); 