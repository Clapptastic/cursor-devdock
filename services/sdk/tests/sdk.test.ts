// @ts-expect-error
import { CustomerSurveySDK } from '../src/index';

// Mock fetch
global.fetch = jest.fn();

describe('CustomerSurveySDK', () => {
  let sdk: any;
  
  beforeEach(() => {
    // Reset mocks
    global.fetch.mockClear();
    
    // Create new instance for each test
    sdk = new CustomerSurveySDK({
      apiUrl: 'http://localhost:3000'
    });
  });

  // Constructor tests
  describe('constructor', () => {
    it('should create an instance', () => {
      expect(sdk).toBeInstanceOf(CustomerSurveySDK);
    });

    it('should throw if apiUrl is not provided', () => {
      expect(() => new CustomerSurveySDK({})).toThrow('API URL is required');
    });
  });

  // Authentication tests
  describe('Authentication', () => {
    it('should set auth token', () => {
      sdk.setAuthToken('test-token');
      expect(sdk.getAuthToken()).toBe('test-token');
    });

    it('should clear auth token', () => {
      sdk.setAuthToken('test-token');
      sdk.clearAuthToken();
      expect(sdk.getAuthToken()).toBeNull();
    });
  });

  // Survey API tests
  describe('Survey API', () => {
    it('should get all surveys', async () => {
      const mockSurveys = [{ id: '1', name: 'Test Survey' }];
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSurveys),
        })
      );

      const result = await sdk.getAllSurveys();
      expect(result).toEqual(mockSurveys);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/surveys', expect.any(Object));
    });

    it('should get survey by id', async () => {
      const mockSurvey = { id: '1', name: 'Test Survey' };
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSurvey),
        })
      );

      const result = await sdk.getSurveyById('1');
      expect(result).toEqual(mockSurvey);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/surveys/1', expect.any(Object));
    });

    it('should create a new survey', async () => {
      const newSurvey = { name: 'New Survey', questions: [] };
      const createdSurvey = { id: '123', ...newSurvey };
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdSurvey),
        })
      );

      const result = await sdk.createSurvey(newSurvey);
      expect(result).toEqual(createdSurvey);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/surveys',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newSurvey),
        })
      );
    });
  });

  // Response API tests
  describe('Response API', () => {
    it('should get responses for a survey', async () => {
      const mockResponses = [{ id: '1', surveyId: '1', answers: [] }];
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses),
        })
      );

      const result = await sdk.getSurveyResponses('1');
      expect(result).toEqual(mockResponses);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/responses?surveyId=1', expect.any(Object));
    });

    it('should submit response', async () => {
      const response = { surveyId: '1', answers: [] };
      const submittedResponse = { id: '123', ...response };
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(submittedResponse),
        })
      );

      const result = await sdk.submitResponse(response);
      expect(result).toEqual(submittedResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/responses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(response),
        })
      );
    });
  });

  // AI API tests
  describe('AI API', () => {
    it('should analyze text', async () => {
      const text = 'This is a great product!';
      const analysis = { sentiment: 'positive', score: 0.9 };
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(analysis),
        })
      );

      const result = await sdk.analyzeText(text);
      expect(result).toEqual(analysis);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/ai/analyze/text',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text }),
        })
      );
    });

    it('should get insights from responses', async () => {
      const surveyId = '1';
      const insights = { averageRating: 4.5, sentimentAnalysis: 'positive' };
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(insights),
        })
      );

      const result = await sdk.getInsights(surveyId);
      expect(result).toEqual(insights);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/ai/insights',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ surveyId }),
        })
      );
    });
  });

  // Error handling tests
  describe('Error handling', () => {
    it('should handle API errors', async () => {
      const errorResponse = { error: 'Not found', code: 404 };
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve(errorResponse),
        })
      );

      await expect(sdk.getSurveyById('999')).rejects.toMatchObject({
        message: 'API Error: Not found',
        code: 404,
      });
    });

    it('should handle network errors', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network Error'))
      );

      await expect(sdk.getAllSurveys()).rejects.toThrow('Network Error');
    });
  });
}); 