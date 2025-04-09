import axios from 'axios';

// Define base URLs for all services
const CLAUDE_TASK_MASTER_URL = process.env.CLAUDE_TASK_MASTER_URL || 'http://localhost:10002';
const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:10004';
const BROWSER_TOOLS_URL = process.env.BROWSER_TOOLS_URL || 'http://localhost:10005';
const DEBUG_VISUALIZER_URL = process.env.DEBUG_VISUALIZER_URL || 'http://localhost:10006';
const KANEO_URL = process.env.KANEO_URL || 'http://localhost:10007';
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://localhost:10001';
const MCP_KONNECT_URL = process.env.MCP_KONNECT_URL || 'http://localhost:10000';

// For browser-side requests, always use localhost URLs
const CLIENT_CLAUDE_TASK_MASTER_URL = 'http://localhost:10002';
const CLIENT_SCRAPER_URL = 'http://localhost:10004';
const CLIENT_BROWSER_TOOLS_URL = 'http://localhost:10005';
const CLIENT_DEBUG_VISUALIZER_URL = 'http://localhost:10006';
const CLIENT_KANEO_URL = 'http://localhost:10007';
const CLIENT_MCP_REST_API_URL = 'http://localhost:10001';
const CLIENT_MCP_KONNECT_URL = 'http://localhost:10000';

// Create axios instances for each service
export const claudeAPI = axios.create({
  baseURL: CLAUDE_TASK_MASTER_URL,
});

export const scraperAPI = axios.create({
  baseURL: SCRAPER_URL,
});

export const browserToolsAPI = axios.create({
  baseURL: BROWSER_TOOLS_URL,
});

export const debugVisualizerAPI = axios.create({
  baseURL: DEBUG_VISUALIZER_URL,
});

export const kaneoAPI = axios.create({
  baseURL: KANEO_URL,
});

export const mcpRestAPI = axios.create({
  baseURL: MCP_REST_API_URL,
});

export const mcpKonnectAPI = axios.create({
  baseURL: MCP_KONNECT_URL,
});

// Helper functions for common API calls

// Claude Task Master API calls
export const submitTask = async (taskData) => {
  const { title, prompt, context, priority, model, dependencies } = taskData;
  
  // Convert dependencies string to array if necessary
  let deps = dependencies;
  if (typeof dependencies === 'string' && dependencies.trim() !== '') {
    deps = dependencies.split(',').map(id => id.trim());
  }
  
  return claudeAPI.post('/api/tasks', {
    title,
    prompt,
    context,
    priority,
    model,
    dependencies: deps
  });
};

export const getTasks = async () => {
  return claudeAPI.get('/api/tasks');
};

export const getTaskById = async (taskId) => {
  return claudeAPI.get(`/api/tasks/${taskId}`);
};

export const updateTaskStatus = async (taskId, status) => {
  return claudeAPI.put(`/api/tasks/${taskId}/status`, { status });
};

export const deleteTask = async (taskId) => {
  return claudeAPI.delete(`/api/tasks/${taskId}`);
};

// New Task Master Functions
export const generateSubtasks = async (taskId, numSubtasks = 3, context = '') => {
  return claudeAPI.post(`/api/tasks/${taskId}/subtasks`, { 
    num: numSubtasks,
    context
  });
};

export const clearSubtasks = async (taskId) => {
  return claudeAPI.delete(`/api/tasks/${taskId}/subtasks`);
};

export const analyzeTaskComplexity = async (taskIds = [], threshold = 5) => {
  return claudeAPI.post('/api/analyze-complexity', {
    taskIds: taskIds.length > 0 ? taskIds : undefined,
    threshold
  });
};

export const getNextTask = async () => {
  return claudeAPI.get('/api/next-task');
};

export const addTaskDependency = async (taskId, dependsOnId) => {
  return claudeAPI.post(`/api/tasks/${taskId}/dependencies`, {
    dependsOn: dependsOnId
  });
};

export const removeTaskDependency = async (taskId, dependsOnId) => {
  return claudeAPI.delete(`/api/tasks/${taskId}/dependencies/${dependsOnId}`);
};

export const updateTaskPriority = async (taskId, priority) => {
  return claudeAPI.put(`/api/tasks/${taskId}/priority`, { priority });
};

// Scraper API calls
export const scrapeURL = async (url, selectors, stealthMode = false) => {
  const endpoint = stealthMode ? '/stealth-scrape' : '/scrape';
  return scraperAPI.post(endpoint, { url, selectors });
};

// Browser Tools API calls
export const getBrowserLogs = async () => {
  return browserToolsAPI.get('/api/browser-logs');
};

export const getConsoleErrors = async () => {
  return browserToolsAPI.get('/api/console-errors');
};

export const getNetworkErrors = async () => {
  return browserToolsAPI.get('/api/network-errors');
};

export const getNetworkLogs = async () => {
  return browserToolsAPI.get('/api/network-logs');
};

export const reportBrowserLog = async (url, event, details = {}) => {
  return browserToolsAPI.post('/api/browser-logs', { url, event, details });
};

export const reportConsoleError = async (url, message, stack) => {
  return browserToolsAPI.post('/api/console-errors', { url, message, stack });
};

export const reportNetworkError = async (url, status, statusText, method) => {
  return browserToolsAPI.post('/api/network-errors', { url, status, statusText, method });
};

export const reportNetworkLog = async (url, method, status, duration, size) => {
  return browserToolsAPI.post('/api/network-logs', { url, method, status, duration, size });
};

// MCP REST API calls
export const getMCPServices = async () => {
  return mcpKonnectAPI.get('/api/services');
};

export const registerService = async (serviceData) => {
  return mcpRestAPI.post('/services', serviceData);
};

// Helper to check if a service is available
export const checkServiceStatus = async (url) => {
  try {
    await axios.get(url, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

// Check connection to all services
export const checkAllServices = async () => {
  try {
    // Determine if we're running in the browser
    const isBrowser = typeof window !== 'undefined';
    
    // Get services from MCP Konnect - use client URL if in browser
    const konnectURL = isBrowser ? CLIENT_MCP_KONNECT_URL : MCP_KONNECT_URL;
    const servicesResponse = await axios.get(`${konnectURL}/api/services`);
    
    if (servicesResponse.data && Array.isArray(servicesResponse.data)) {
      const servicesList = servicesResponse.data.map(service => {
        // Get the appropriate URL for the service
        let displayUrl = service.url;
        
        // If in browser, translate Docker internal URLs to localhost URLs
        if (isBrowser) {
          if (service.name === 'MCP REST API') displayUrl = CLIENT_MCP_REST_API_URL;
          else if (service.name === 'claude-task-master') displayUrl = CLIENT_CLAUDE_TASK_MASTER_URL;
          else if (service.name === 'scraper') displayUrl = CLIENT_SCRAPER_URL;
          else if (service.name === 'browser-tools') displayUrl = CLIENT_BROWSER_TOOLS_URL;
          else if (service.name === 'debug-visualizer') displayUrl = CLIENT_DEBUG_VISUALIZER_URL;
          else if (service.name === 'kaneo') displayUrl = CLIENT_KANEO_URL;
        }
        
        return {
          name: service.name,
          url: displayUrl,
          status: service.status === 'active' ? 'available' : 'unavailable'
        };
      });
      
      // Add MCP Konnect to the list which isn't part of the returned services
      servicesList.push({
        name: 'MCP Konnect',
        url: isBrowser ? CLIENT_MCP_KONNECT_URL : MCP_KONNECT_URL,
        status: 'available'
      });
      
      return servicesList;
    }
    
    throw new Error('Invalid services response format');
  } catch (error) {
    console.error('Error checking services:', error);
    
    // If we're in the browser, use client URLs for fallback
    const isBrowser = typeof window !== 'undefined';
    
    // If we can't reach the API, return all services as unavailable
    return [
      { name: 'MCP REST API', url: isBrowser ? CLIENT_MCP_REST_API_URL : MCP_REST_API_URL, status: 'unavailable' },
      { name: 'MCP Konnect', url: isBrowser ? CLIENT_MCP_KONNECT_URL : MCP_KONNECT_URL, status: 'unavailable' },
      { name: 'Claude Task Master', url: isBrowser ? CLIENT_CLAUDE_TASK_MASTER_URL : CLAUDE_TASK_MASTER_URL, status: 'unavailable' },
      { name: 'Scraper', url: isBrowser ? CLIENT_SCRAPER_URL : SCRAPER_URL, status: 'unavailable' },
      { name: 'Browser Tools', url: isBrowser ? CLIENT_BROWSER_TOOLS_URL : BROWSER_TOOLS_URL, status: 'unavailable' },
      { name: 'Debug Visualizer', url: isBrowser ? CLIENT_DEBUG_VISUALIZER_URL : DEBUG_VISUALIZER_URL, status: 'unavailable' },
      { name: 'Kaneo', url: isBrowser ? CLIENT_KANEO_URL : KANEO_URL, status: 'unavailable' },
    ];
  }
}; 