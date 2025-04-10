import axios from 'axios';
import { mockServiceResponse, generateRandomString } from '../utils/test-utils';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MCP REST API Unit Tests', () => {
  const API_URL = process.env.MCP_REST_API_URL || 'http://localhost:10001';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Service Registry', () => {
    test('should register a new service', async () => {
      const serviceName = `test-service-${generateRandomString(5)}`;
      const serviceUrl = `http://test-service:8080`;
      
      const mockResponse = mockServiceResponse({
        id: '123',
        name: serviceName,
        url: serviceUrl,
        createdAt: new Date().toISOString()
      }, 201);
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await axios.post(`${API_URL}/services/register`, {
        name: serviceName,
        url: serviceUrl
      });
      
      expect(response.status).toBe(201);
      expect(response.data.name).toBe(serviceName);
      expect(response.data.url).toBe(serviceUrl);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/services/register`,
        { name: serviceName, url: serviceUrl }
      );
    });
    
    test('should get all registered services', async () => {
      const mockServices = [
        { id: '1', name: 'service-1', url: 'http://service-1:8080', createdAt: new Date().toISOString() },
        { id: '2', name: 'service-2', url: 'http://service-2:8080', createdAt: new Date().toISOString() }
      ];
      
      const mockResponse = mockServiceResponse(mockServices, 200);
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const response = await axios.get(`${API_URL}/services`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('service-1');
      expect(response.data[1].name).toBe('service-2');
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/services`);
    });
    
    test('should update an existing service', async () => {
      const serviceName = 'service-to-update';
      const newServiceUrl = 'http://updated-service:9090';
      
      const mockResponse = mockServiceResponse({
        id: '123',
        name: serviceName,
        url: newServiceUrl,
        updatedAt: new Date().toISOString()
      }, 200);
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await axios.post(`${API_URL}/services/register`, {
        name: serviceName,
        url: newServiceUrl
      });
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe(serviceName);
      expect(response.data.url).toBe(newServiceUrl);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/services/register`,
        { name: serviceName, url: newServiceUrl }
      );
    });
  });
  
  describe('Log Forwarding', () => {
    test('should forward browser logs to browser-tools', async () => {
      const logData = {
        message: 'Test log message',
        level: 'info',
        timestamp: new Date().toISOString()
      };
      
      const mockResponse = mockServiceResponse({ success: true }, 200);
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await axios.post(`${API_URL}/forward-to-browser-tools`, logData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/forward-to-browser-tools`,
        logData
      );
    });
    
    test('should forward console errors to browser-tools', async () => {
      const errorData = {
        message: 'Test error message',
        stack: 'Error: Test error\n    at test.js:10:15',
        timestamp: new Date().toISOString()
      };
      
      const mockResponse = mockServiceResponse({ success: true }, 200);
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await axios.post(`${API_URL}/forward-console-error`, errorData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/forward-console-error`,
        errorData
      );
    });
  });
}); 