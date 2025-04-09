const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');
const winston = require('winston');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'kaneo-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'kaneo.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3333;
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(express.static('public'));

// Store registered services
const registeredServices = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', version: '1.0.0' });
});

// API to register a service
app.post('/api/services/register', (req, res) => {
  try {
    const { name, url, description, type, features } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Service name and URL are required' });
    }
    
    const serviceId = Date.now().toString();
    const service = {
      id: serviceId,
      name,
      url,
      description: description || '',
      type: type || 'generic',
      features: features || [],
      status: 'active',
      registeredAt: new Date().toISOString()
    };
    
    registeredServices.set(serviceId, service);
    logger.info(`Service registered: ${name} at ${url}`);
    
    res.status(201).json(service);
  } catch (error) {
    logger.error('Error registering service:', error);
    res.status(500).json({ error: 'Failed to register service' });
  }
});

// API to get all registered services
app.get('/api/services', (req, res) => {
  try {
    const services = Array.from(registeredServices.values());
    res.json(services);
  } catch (error) {
    logger.error('Error getting services:', error);
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

// API to get service by ID
app.get('/api/services/:id', (req, res) => {
  try {
    const service = registeredServices.get(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    logger.error(`Error getting service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve service' });
  }
});

// API to unregister a service
app.delete('/api/services/:id', (req, res) => {
  try {
    const serviceId = req.params.id;
    
    if (!registeredServices.has(serviceId)) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const service = registeredServices.get(serviceId);
    registeredServices.delete(serviceId);
    logger.info(`Service unregistered: ${service.name}`);
    
    res.json({ message: 'Service unregistered successfully' });
  } catch (error) {
    logger.error(`Error unregistering service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to unregister service' });
  }
});

// API to update service status
app.put('/api/services/:id/status', (req, res) => {
  try {
    const serviceId = req.params.id;
    const { status } = req.body;
    
    if (!registeredServices.has(serviceId)) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: active, inactive, maintenance' });
    }
    
    const service = registeredServices.get(serviceId);
    service.status = status;
    service.updatedAt = new Date().toISOString();
    registeredServices.set(serviceId, service);
    
    logger.info(`Service ${service.name} status updated to ${status}`);
    res.json(service);
  } catch (error) {
    logger.error(`Error updating service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update service status' });
  }
});

// Forward API requests to MCP REST API
app.post('/api/route-task', async (req, res) => {
  try {
    const response = await axios.post(`${MCP_REST_API_URL}/route-task`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Error routing task:', error);
    res.status(500).json({ error: 'Failed to route task' });
  }
});

// Create a simple HTML dashboard
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Kaneo service running on port ${PORT}`);
  console.log(`Kaneo service running on port ${PORT}`);
}); 