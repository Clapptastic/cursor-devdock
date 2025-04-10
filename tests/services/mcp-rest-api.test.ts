import axios from 'axios';
import { 
  MCP_REST_API_URL, 
  createTestService, 
  registerService, 
  getServices,
  forwardLogs,
  forwardConsoleError,
  forwardNetworkError
} from '../utils/test-utils';

// Mock axios to prevent actual API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MCP REST API Service', () => {
  beforeEach(() => {
    // Reset mock before each test
    jest.resetAllMocks();
  });

  describe('Service Registration', () => {
    test('should register a new service', async () => {
      // Mock API response
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, message: 'Service registered successfully' },
        status: 201
      });

      // Create a test service
      const testService = createTestService('test-service', 'http://test-service:8080');

      // Register the service
      const result = await registerService(testService);

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${MCP_REST_API_URL}/services/register`, 
        testService
      );

      // Verify response
      expect(result.data.success).toBe(true);
      expect(result.status).toBe(201);
    });

    test('should update an existing service', async () => {
      // Mock API response
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, message: 'Service updated successfully' },
        status: 200
      });

      // Create a test service
      const testService = createTestService('existing-service', 'http://existing-service:8080');

      // Register the service
      const result = await registerService(testService);

      // Verify response
      expect(result.data.success).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Service Retrieval', () => {
    test('should get all registered services', async () => {
      // Mock services data
      const mockServices = [
        createTestService('service1', 'http://service1:8080'),
        createTestService('service2', 'http://service2:8080')
      ];

      // Mock API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockServices,
        status: 200
      });

      // Get all services
      const services = await getServices();

      // Verify axios was called correctly
      expect(mockedAxios.get).toHaveBeenCalledWith(`${MCP_REST_API_URL}/services`);

      // Verify response
      expect(services).toEqual(mockServices);
      expect(services.length).toBe(2);
    });
  });

  describe('Log Forwarding', () => {
    test('should forward browser logs', async () => {
      // Mock API response
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
        status: 200
      });

      // Create test logs
      const testLogs = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Test log message'
      };

      // Forward logs
      const result = await forwardLogs(testLogs);

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${MCP_REST_API_URL}/forward-to-browser-tools`, 
        testLogs
      );

      // Verify response
      expect(result.data.success).toBe(true);
    });

    test('should forward console errors', async () => {
      // Mock API response
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
        status: 200
      });

      // Create test error
      const testError = {
        timestamp: new Date().toISOString(),
        message: 'Test console error',
        stack: 'Error stack trace'
      };

      // Forward console error
      const result = await forwardConsoleError(testError);

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${MCP_REST_API_URL}/forward-console-error`, 
        testError
      );

      // Verify response
      expect(result.data.success).toBe(true);
    });

    test('should forward network errors', async () => {
      // Mock API response
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
        status: 200
      });

      // Create test network error
      const testNetworkError = {
        timestamp: new Date().toISOString(),
        url: 'http://example.com/api',
        method: 'GET',
        status: 500,
        message: 'Internal Server Error'
      };

      // Forward network error
      const result = await forwardNetworkError(testNetworkError);

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${MCP_REST_API_URL}/forward-network-error`, 
        testNetworkError
      );

      // Verify response
      expect(result.data.success).toBe(true);
    });
  });
}); 