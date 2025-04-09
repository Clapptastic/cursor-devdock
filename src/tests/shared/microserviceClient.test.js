/**
 * Tests for the Microservice Client
 */

const axios = require('axios');
const microserviceClient = require('../../shared/microserviceClient');

// Mock axios
jest.mock('axios');

describe('Microservice Client', () => {
  // Setup axios mock for all tests
  const axiosCreateSpy = jest.spyOn(axios, 'create');
  let mockAxios;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock axios instance with all the methods we need
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    };
    
    // Make axios.create return our mock
    axiosCreateSpy.mockReturnValue(mockAxios);
  });

  describe('processData', () => {
    it('should call the correct endpoint with data and options', async () => {
      // Setup
      const mockData = [{ id: 1, text: 'test' }];
      const mockOptions = { processingType: 'advanced' };
      const mockResponse = { 
        data: { 
          id: 'proc123', 
          results: { processed: true } 
        } 
      };
      
      mockAxios.post.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await microserviceClient.processData(mockData, mockOptions);
      
      // Verify
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/process', 
        { data: mockData, options: mockOptions }
      );
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle API errors correctly', async () => {
      // Setup
      const mockData = [{ id: 1 }];
      const error = new Error('Network error');
      mockAxios.post.mockRejectedValue(error);
      
      // Execute and verify
      await expect(microserviceClient.processData(mockData)).rejects
        .toThrow('Error processing data: Network error');
    });
  });

  describe('getProcessedData', () => {
    it('should call the correct endpoint with ID', async () => {
      // Setup
      const mockId = 'proc123';
      const mockResponse = { 
        data: { 
          id: mockId, 
          results: { processed: true } 
        } 
      };
      
      mockAxios.get.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await microserviceClient.getProcessedData(mockId);
      
      // Verify
      expect(mockAxios.get).toHaveBeenCalledWith(`/api/process/${mockId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('analyzeSentiment', () => {
    it('should call the sentiment analysis endpoint', async () => {
      // Setup
      const mockData = [{ text: 'I love this survey!' }];
      const mockOptions = { language: 'en' };
      const mockResponse = { 
        data: { 
          sentiment: { 
            positive: 0.8, 
            negative: 0.1, 
            neutral: 0.1 
          } 
        } 
      };
      
      mockAxios.post.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await microserviceClient.analyzeSentiment(mockData, mockOptions);
      
      // Verify
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/process/sentiment', 
        { data: mockData, options: mockOptions }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('analyzeThemes', () => {
    it('should call the theme analysis endpoint', async () => {
      // Setup
      const mockData = [
        { text: 'The user interface could be improved' },
        { text: 'I love the user experience' }
      ];
      const mockOptions = { minFrequency: 2 };
      const mockResponse = { 
        data: { 
          themes: [
            { name: 'user interface', count: 1 },
            { name: 'user experience', count: 1 }
          ] 
        } 
      };
      
      mockAxios.post.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await microserviceClient.analyzeThemes(mockData, mockOptions);
      
      // Verify
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/process/themes', 
        { data: mockData, options: mockOptions }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('analyzeTrends', () => {
    it('should call the trends analysis endpoint with current and previous data', async () => {
      // Setup
      const mockCurrentData = [{ score: 8 }, { score: 9 }];
      const mockPreviousData = [{ score: 7 }, { score: 7 }];
      const mockOptions = { compareMethod: 'average' };
      const mockResponse = { 
        data: { 
          trends: { 
            improvement: 1.5, 
            direction: 'positive' 
          } 
        } 
      };
      
      mockAxios.post.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await microserviceClient.analyzeTrends(
        mockCurrentData, 
        mockPreviousData, 
        mockOptions
      );
      
      // Verify
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/analysis/trends', 
        { 
          currentData: mockCurrentData, 
          previousData: mockPreviousData, 
          options: mockOptions 
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('checkHealth', () => {
    it('should call the health endpoint', async () => {
      // Setup
      const mockResponse = { 
        data: { 
          status: 'ok', 
          database: 'connected', 
          uptime: 3600 
        } 
      };
      
      mockAxios.get.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await microserviceClient.checkHealth();
      
      // Verify
      expect(mockAxios.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw an error if health check fails', async () => {
      // Setup
      const error = {
        response: {
          status: 503,
          data: { error: 'Database connection failed' }
        }
      };
      mockAxios.get.mockRejectedValue(error);
      
      // Execute and verify
      await expect(microserviceClient.checkHealth()).rejects
        .toThrow('Microservice health check failed: 503');
    });
  });

  describe('error handling', () => {
    it('should handle errors with response', async () => {
      // Setup
      const error = {
        response: {
          status: 400,
          data: { error: 'Bad request', message: 'Invalid data format' }
        }
      };
      mockAxios.post.mockRejectedValue(error);
      
      // Execute and verify
      await expect(microserviceClient.processData([])).rejects
        .toThrow('Error processing data: 400');
    });
    
    it('should handle errors with no response', async () => {
      // Setup
      const error = { request: {} };
      mockAxios.post.mockRejectedValue(error);
      
      // Execute and verify
      await expect(microserviceClient.processData([])).rejects
        .toThrow('Error processing data: No response received');
    });
    
    it('should handle other errors', async () => {
      // Setup
      const error = new Error('Unknown error');
      mockAxios.post.mockRejectedValue(error);
      
      // Execute and verify
      await expect(microserviceClient.processData([])).rejects
        .toThrow('Error processing data: Unknown error');
    });
  });
});