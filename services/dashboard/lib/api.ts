import axios from 'axios';

// Define base URLs for all services
const CLAUDE_TASK_MASTER_URL = process.env.CLAUDE_TASK_MASTER_URL || 'http://localhost:10002';
const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:10004';
const BROWSER_TOOLS_URL = process.env.BROWSER_TOOLS_URL || 'http://localhost:10005';
const DEBUG_VISUALIZER_URL = process.env.DEBUG_VISUALIZER_URL || 'http://localhost:10006';
const KANEO_URL = process.env.KANEO_URL || 'http://localhost:10007';
const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://localhost:10001';

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

// Helper functions for common API calls

// Claude Task Master API calls
export const submitTask = async (taskData) => {
  return claudeAPI.post('/tasks', taskData);
};

export const getTasks = async () => {
  return claudeAPI.get('/tasks');
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
  return mcpRestAPI.get('/services');
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
  const services = [
    { name: 'Claude Task Master', url: CLAUDE_TASK_MASTER_URL },
    { name: 'Scraper', url: SCRAPER_URL },
    { name: 'Browser Tools', url: BROWSER_TOOLS_URL },
    { name: 'Debug Visualizer', url: DEBUG_VISUALIZER_URL },
    { name: 'Kaneo', url: KANEO_URL },
    { name: 'MCP REST API', url: MCP_REST_API_URL },
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      const isAvailable = await checkServiceStatus(`${service.url}/`);
      return {
        ...service,
        status: isAvailable ? 'available' : 'unavailable',
      };
    })
  );

  return results;
}; 