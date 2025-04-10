const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');
const winston = require('winston');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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
const MCP_KONNECT_URL = process.env.MCP_KONNECT_URL || 'http://mcp-konnect:3333';
const POLL_INTERVAL = process.env.POLL_INTERVAL || 30000; // 30 seconds
const SERVICE_TIMEOUT = process.env.SERVICE_TIMEOUT || 10000; // 10 seconds

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(express.static('public'));

// Store registered services
const registeredServices = new Map();
const serviceHealth = new Map();
let isPolling = false;

// Initialize MCP connections
async function initializeConnections() {
  try {
    // Register Kaneo with MCP REST API
    await axios.post(`${MCP_REST_API_URL}/api/services/register`, {
      name: 'Kaneo Dashboard',
      url: `http://kaneo:${PORT}`,
      description: 'Centralized control panel for managing MCP services and configurations',
      type: 'dashboard',
      features: ['service-management', 'health-monitoring', 'configuration']
    }, { timeout: SERVICE_TIMEOUT });
    
    logger.info(`Registered Kaneo with MCP REST API at ${MCP_REST_API_URL}`);
    
    // Start polling for service health
    startHealthPolling();
    
    // Sync services from MCP REST API
    await syncServices();
    
  } catch (error) {
    logger.error('Error initializing MCP connections:', error);
    // Retry after a delay
    setTimeout(initializeConnections, 5000);
  }
}

// Poll service health
async function startHealthPolling() {
  if (isPolling) return;
  
  isPolling = true;
  
  const checkServiceHealth = async () => {
    try {
      // Get all services
      const services = Array.from(registeredServices.values());
      
      for (const service of services) {
        try {
          // Check health endpoint
          const response = await axios.get(`${service.url}/health`, { 
            timeout: SERVICE_TIMEOUT 
          });
          
          const isHealthy = response.status === 200 && 
            response.data && 
            (response.data.status === 'UP' || response.data.status === 'OK');
          
          serviceHealth.set(service.id, {
            healthy: isHealthy,
            lastChecked: new Date().toISOString(),
            statusCode: response.status,
            statusMessage: isHealthy ? 'Available' : 'Degraded'
          });
          
          // Update service status in registry
          const registeredService = registeredServices.get(service.id);
          if (registeredService) {
            registeredService.status = isHealthy ? 'active' : 'degraded';
            registeredService.lastChecked = new Date().toISOString();
            registeredServices.set(service.id, registeredService);
          }
          
        } catch (err) {
          serviceHealth.set(service.id, {
            healthy: false,
            lastChecked: new Date().toISOString(),
            statusCode: err.response?.status || 0,
            statusMessage: err.message || 'Unavailable'
          });
          
          // Update service status in registry
          const registeredService = registeredServices.get(service.id);
          if (registeredService) {
            registeredService.status = 'unavailable';
            registeredService.lastChecked = new Date().toISOString();
            registeredServices.set(service.id, registeredService);
          }
        }
      }
      
      // Sync with MCP REST API
      await syncServices();
      
    } catch (error) {
      logger.error('Error checking service health:', error);
    }
    
    setTimeout(checkServiceHealth, POLL_INTERVAL);
  };
  
  // Start checking health
  checkServiceHealth();
}

// Sync services from MCP REST API
async function syncServices() {
  try {
    // Get services from MCP REST API
    const response = await axios.get(`${MCP_REST_API_URL}/api/services`, { 
      timeout: SERVICE_TIMEOUT 
    });
    
    if (response.data && Array.isArray(response.data)) {
      // Merge services
      response.data.forEach(service => {
        if (!registeredServices.has(service.id)) {
          registeredServices.set(service.id, {
            ...service,
            source: 'mcp-rest-api'
          });
        }
      });
    }
  } catch (error) {
    logger.error('Error syncing services from MCP REST API:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    version: '1.0.0',
    mcpConnections: {
      mcpRestApi: serviceHealth.get('mcp-rest-api')?.healthy || false,
      mcpKonnect: serviceHealth.get('mcp-konnect')?.healthy || false
    }
  });
});

// API to register a service
app.post('/api/services/register', async (req, res) => {
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
    
    // Forward registration to MCP REST API
    try {
      await axios.post(`${MCP_REST_API_URL}/api/services/register`, service, {
        timeout: SERVICE_TIMEOUT
      });
      logger.info(`Forwarded service registration to MCP REST API: ${name}`);
    } catch (error) {
      logger.error(`Error forwarding service registration to MCP REST API: ${error.message}`);
    }
    
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
    
    // Include health status
    const servicesWithHealth = services.map(service => ({
      ...service,
      health: serviceHealth.get(service.id) || {
        healthy: false,
        lastChecked: null,
        statusCode: 0,
        statusMessage: 'Not checked'
      }
    }));
    
    res.json(servicesWithHealth);
  } catch (error) {
    logger.error('Error getting services:', error);
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

// API to get service health
app.get('/api/services/health', (req, res) => {
  try {
    const healthData = Array.from(serviceHealth.entries()).map(([id, health]) => {
      const service = registeredServices.get(id);
      return {
        id,
        name: service?.name || 'Unknown Service',
        url: service?.url || 'Unknown URL',
        health
      };
    });
    
    res.json(healthData);
  } catch (error) {
    logger.error('Error getting service health:', error);
    res.status(500).json({ error: 'Failed to retrieve service health' });
  }
});

// Alias endpoint for MCP REST API to use
app.post('/apis', (req, res) => {
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

// API to get service by ID
app.get('/api/services/:id', (req, res) => {
  try {
    const service = registeredServices.get(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Include health information
    const healthInfo = serviceHealth.get(req.params.id) || {
      healthy: false,
      lastChecked: null,
      statusCode: 0,
      statusMessage: 'Not checked'
    };
    
    res.json({
      ...service,
      health: healthInfo
    });
  } catch (error) {
    logger.error(`Error getting service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve service' });
  }
});

// API to unregister a service
app.delete('/api/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    if (!registeredServices.has(serviceId)) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const service = registeredServices.get(serviceId);
    registeredServices.delete(serviceId);
    serviceHealth.delete(serviceId);
    logger.info(`Service unregistered: ${service.name}`);
    
    // Forward unregistration to MCP REST API
    try {
      await axios.delete(`${MCP_REST_API_URL}/api/services/${serviceId}`, {
        timeout: SERVICE_TIMEOUT
      });
      logger.info(`Forwarded service unregistration to MCP REST API: ${service.name}`);
    } catch (error) {
      logger.error(`Error forwarding service unregistration to MCP REST API: ${error.message}`);
    }
    
    res.json({ message: 'Service unregistered successfully' });
  } catch (error) {
    logger.error(`Error unregistering service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to unregister service' });
  }
});

// API to update service status
app.put('/api/services/:id/status', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { status } = req.body;
    
    if (!registeredServices.has(serviceId)) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (!status || !['active', 'inactive', 'maintenance', 'degraded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: active, inactive, maintenance, degraded' });
    }
    
    const service = registeredServices.get(serviceId);
    service.status = status;
    service.updatedAt = new Date().toISOString();
    registeredServices.set(serviceId, service);
    
    // Forward status update to MCP REST API
    try {
      await axios.put(`${MCP_REST_API_URL}/api/services/${serviceId}/status`, {
        status
      }, {
        timeout: SERVICE_TIMEOUT
      });
      logger.info(`Forwarded service status update to MCP REST API: ${service.name} - ${status}`);
    } catch (error) {
      logger.error(`Error forwarding service status update to MCP REST API: ${error.message}`);
    }
    
    logger.info(`Service ${service.name} status updated to ${status}`);
    res.json(service);
  } catch (error) {
    logger.error(`Error updating service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update service status' });
  }
});

// Proxy API requests to MCP REST API
app.post('/api/route-task', async (req, res) => {
  try {
    const response = await axios.post(`${MCP_REST_API_URL}/route-task`, req.body, {
      timeout: SERVICE_TIMEOUT
    });
    res.json(response.data);
  } catch (error) {
    logger.error('Error routing task:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to route task',
      details: error.response?.data || error.message
    });
  }
});

// Get MCP status
app.get('/api/mcp/status', async (req, res) => {
  try {
    const mcpStatus = {
      mcpRestApi: {
        healthy: false,
        version: null,
        message: 'Not checked'
      },
      mcpKonnect: {
        healthy: false,
        version: null,
        message: 'Not checked'
      }
    };
    
    // Check MCP REST API
    try {
      const restApiResponse = await axios.get(`${MCP_REST_API_URL}/health`, {
        timeout: SERVICE_TIMEOUT
      });
      
      mcpStatus.mcpRestApi = {
        healthy: restApiResponse.status === 200,
        version: restApiResponse.data?.version || 'unknown',
        message: restApiResponse.data?.status || 'OK'
      };
    } catch (error) {
      mcpStatus.mcpRestApi.message = error.message;
    }
    
    // Check MCP Konnect
    try {
      const konnectResponse = await axios.get(`${MCP_KONNECT_URL}/health`, {
        timeout: SERVICE_TIMEOUT
      });
      
      mcpStatus.mcpKonnect = {
        healthy: konnectResponse.status === 200,
        version: konnectResponse.data?.version || 'unknown',
        message: konnectResponse.data?.status || 'OK'
      };
    } catch (error) {
      mcpStatus.mcpKonnect.message = error.message;
    }
    
    res.json(mcpStatus);
  } catch (error) {
    logger.error('Error getting MCP status:', error);
    res.status(500).json({ error: 'Failed to retrieve MCP status' });
  }
});

// API to get logs from a service
app.get('/api/services/:id/logs', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = registeredServices.get(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Try to get logs from the service
    try {
      const response = await axios.get(`${service.url}/logs`, {
        timeout: SERVICE_TIMEOUT
      });
      res.json(response.data);
    } catch (error) {
      // If service doesn't have logs endpoint, try MCP REST API
      try {
        const mcpResponse = await axios.get(`${MCP_REST_API_URL}/api/services/${serviceId}/logs`, {
          timeout: SERVICE_TIMEOUT
        });
        res.json(mcpResponse.data);
      } catch (mcpError) {
        res.status(404).json({ error: 'Logs not available for this service' });
      }
    }
  } catch (error) {
    logger.error(`Error getting logs for service ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve service logs' });
  }
});

// Create a simple HTML dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Kaneo service running on port ${PORT}`);
  console.log(`Kaneo service running on port ${PORT}`);
  
  // Initialize connections after server starts
  initializeConnections();
}); 