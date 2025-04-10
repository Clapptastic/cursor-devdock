import axios, { AxiosResponse } from 'axios';

/**
 * Wait for a service to be available
 * @param url The URL to check
 * @param maxRetries Maximum number of retries
 * @param retryInterval Interval between retries in ms
 */
export async function waitForService(
  url: string, 
  maxRetries: number = 10, 
  retryInterval: number = 1000
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, { timeout: 2000 });
      if (response.status >= 200 && response.status < 300) {
        return true;
      }
    } catch (error) {
      console.log(`Service ${url} not available, retrying...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, retryInterval));
  }
  
  return false;
}

/**
 * Generate a random string for test data
 * @param length Length of the string
 */
export function generateRandomString(length: number = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Mock service response
 * @param data Response data
 * @param status HTTP status code
 */
export function mockServiceResponse<T>(data: T, status: number = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {} as any
  };
}

/**
 * Get a valid service URL from the container or localhost
 * @param serviceName Name of the service as in docker-compose.yml
 * @param fallbackPort Fallback port to use if service container not available
 */
export function getServiceUrl(serviceName: string, fallbackPort: number): string {
  // In CI environment, use container service name
  if (process.env.CI) {
    return `http://${serviceName}`;
  }
  
  // In local environment, use localhost
  return `http://localhost:${fallbackPort}`;
}

/**
 * Check if an object has all required keys
 * @param obj Object to check
 * @param keys Required keys
 */
export function hasRequiredKeys(obj: Record<string, any>, keys: string[]): boolean {
  return keys.every(key => Object.prototype.hasOwnProperty.call(obj, key));
}

/**
 * Extract errors from an API response
 * @param response API response
 */
export function extractErrors(response: any): string[] {
  const errors: string[] = [];
  
  if (response?.error) {
    errors.push(response.error);
  }
  
  if (response?.errors && Array.isArray(response.errors)) {
    errors.push(...response.errors);
  }
  
  return errors;
}

// Base URL for MCP REST API service
export const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://localhost:10001';

/**
 * Creates a test service for testing the service registry
 * @param name Service name
 * @param url Service URL
 * @returns The created service object
 */
export const createTestService = (name: string, url: string) => {
  return {
    name,
    url,
    description: `Test service: ${name}`,
    endpoints: [
      {
        path: '/test',
        method: 'GET',
        description: 'Test endpoint'
      }
    ]
  };
};

/**
 * Registers a service with the MCP REST API
 * @param service Service object to register
 * @returns Axios response
 */
export const registerService = async (service: any) => {
  return axios.post(`${MCP_REST_API_URL}/services/register`, service);
};

/**
 * Gets all registered services
 * @returns List of registered services
 */
export const getServices = async () => {
  const response = await axios.get(`${MCP_REST_API_URL}/services`);
  return response.data;
};

/**
 * Forwards logs to browser tools
 * @param logs Log data to forward
 * @returns Axios response
 */
export const forwardLogs = async (logs: any) => {
  return axios.post(`${MCP_REST_API_URL}/forward-to-browser-tools`, logs);
};

/**
 * Forwards console errors to browser tools
 * @param error Error data to forward
 * @returns Axios response
 */
export const forwardConsoleError = async (error: any) => {
  return axios.post(`${MCP_REST_API_URL}/forward-console-error`, error);
};

/**
 * Forwards network errors to browser tools
 * @param error Network error data to forward
 * @returns Axios response
 */
export const forwardNetworkError = async (error: any) => {
  return axios.post(`${MCP_REST_API_URL}/forward-network-error`, error);
};

/**
 * Clears all registered services (for testing purposes)
 * @returns Axios response
 */
export const clearServices = async () => {
  // This endpoint would need to be implemented in the API
  return axios.delete(`${MCP_REST_API_URL}/services/clear`);
}; 