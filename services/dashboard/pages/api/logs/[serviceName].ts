import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { serviceName } = req.query;
  
  if (!serviceName || typeof serviceName !== 'string') {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    // Normalize serviceName for mapping to services
    const normalizedServiceName = serviceName.toLowerCase();
    
    // Different service endpoints for logs
    let logs = [];
    let serviceUrl = '';
    
    // Map service name to URL and endpoint
    switch (normalizedServiceName) {
      case 'browser-tools':
      case 'browser-monitoring': {
        const BROWSER_TOOLS_URL = process.env.BROWSER_TOOLS_URL || 'http://browser-tools:8004';
        serviceUrl = BROWSER_TOOLS_URL;
        // Combine all error logs
        const consoleErrors = await axios.get(`${serviceUrl}/api/logs/console-error`);
        const networkErrors = await axios.get(`${serviceUrl}/api/logs/network-error`);
        
        logs = [
          ...(consoleErrors.data || []).map(log => ({
            timestamp: log.timestamp || new Date().toISOString(),
            message: `Console Error: ${log.message || 'Unknown error'}`,
            service: 'Browser Tools',
            level: 'error',
            details: log
          })),
          ...(networkErrors.data || []).map(log => ({
            timestamp: log.timestamp || new Date().toISOString(),
            message: `Network Error: ${log.url} (${log.status} ${log.statusText})`,
            service: 'Browser Tools',
            level: 'error',
            details: log
          }))
        ];
        break;
      }
      
      case 'mcp-rest-api': {
        const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';
        serviceUrl = MCP_REST_API_URL;
        
        // Get health info which might contain error state
        const health = await axios.get(`${serviceUrl}/health`);
        
        if (health.data && health.data.status !== 'UP') {
          logs.push({
            timestamp: new Date().toISOString(),
            message: `Service Status: ${health.data.status}`,
            service: 'MCP REST API',
            level: 'error'
          });
        }
        
        // In a real implementation, you would fetch actual logs from a logging API
        // For now, return a dummy log if no actual issues
        if (logs.length === 0) {
          logs.push({
            timestamp: new Date().toISOString(),
            message: 'Service is running but logs are not available through API',
            service: 'MCP REST API',
            level: 'info'
          });
        }
        break;
      }
      
      case 'claude-task-master': {
        const CLAUDE_TASK_MASTER_URL = process.env.CLAUDE_TASK_MASTER_URL || 'http://claude-task-master:8002';
        serviceUrl = CLAUDE_TASK_MASTER_URL;
        
        // Get health info
        try {
          await axios.get(`${serviceUrl}/health`);
          // If we get here, service is up but we have no logs endpoint
          logs.push({
            timestamp: new Date().toISOString(),
            message: 'Service is running but logs are not available through API',
            service: 'Claude Task Master',
            level: 'info'
          });
        } catch (error) {
          logs.push({
            timestamp: new Date().toISOString(),
            message: `Service Health Check Failed: ${error.message}`,
            service: 'Claude Task Master',
            level: 'error'
          });
        }
        break;
      }
      
      case 'mcp-konnect': {
        const MCP_KONNECT_URL = process.env.MCP_KONNECT_URL || 'http://mcp-konnect:3333';
        serviceUrl = MCP_KONNECT_URL;
        
        // Try to fetch service list as health check
        try {
          await axios.get(`${serviceUrl}/api/services`);
          // If we get here, service is up but we have no logs endpoint
          logs.push({
            timestamp: new Date().toISOString(),
            message: 'Service is running but logs are not available through API',
            service: 'MCP Konnect',
            level: 'info'
          });
        } catch (error) {
          logs.push({
            timestamp: new Date().toISOString(),
            message: `Service API Failed: ${error.message}`,
            service: 'MCP Konnect',
            level: 'error'
          });
        }
        break;
      }
      
      case 'api-keys-service': {
        const API_KEYS_SERVICE_URL = process.env.API_KEYS_SERVICE_URL || 'http://api-keys-service:8010';
        serviceUrl = API_KEYS_SERVICE_URL;
        
        // Try to fetch health info
        try {
          await axios.get(`${serviceUrl}/health`);
          // If we get here, service is up but we have no logs endpoint
          logs.push({
            timestamp: new Date().toISOString(),
            message: 'Service is running but logs are not available through API',
            service: 'API Keys Service',
            level: 'info'
          });
        } catch (error) {
          logs.push({
            timestamp: new Date().toISOString(),
            message: `Service Health Check Failed: ${error.message}`,
            service: 'API Keys Service',
            level: 'error'
          });
        }
        break;
      }
      
      default: {
        // Generic handler for other services
        try {
          // Look up environment variable for service URL
          const envVarName = `${normalizedServiceName.replace(/-/g, '_').toUpperCase()}_URL`;
          const serviceUrl = process.env[envVarName] || `http://${normalizedServiceName}:8000`;
          
          // Try health endpoint first
          try {
            await axios.get(`${serviceUrl}/health`);
            logs.push({
              timestamp: new Date().toISOString(),
              message: 'Service is running but detailed logs are not available',
              service: normalizedServiceName,
              level: 'info'
            });
          } catch (healthError) {
            // Try to ping the service root
            try {
              await axios.get(serviceUrl);
              logs.push({
                timestamp: new Date().toISOString(),
                message: 'Service is running but no health endpoint available',
                service: normalizedServiceName,
                level: 'warn'
              });
            } catch (pingError) {
              logs.push({
                timestamp: new Date().toISOString(),
                message: `Service unreachable: ${pingError.message}`,
                service: normalizedServiceName,
                level: 'error'
              });
            }
          }
        } catch (error) {
          logs.push({
            timestamp: new Date().toISOString(),
            message: `Failed to check service: ${error.message}`,
            service: normalizedServiceName,
            level: 'error'
          });
        }
      }
    }
    
    // Sort logs by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return res.status(200).json(logs);
  } catch (error) {
    console.error(`Error fetching logs for service ${serviceName}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch service logs',
      message: error.message
    });
  }
} 